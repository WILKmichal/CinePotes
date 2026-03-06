import { RpcException } from "@nestjs/microservices";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { User, UserRole } from "../../../../packages/schemas/user.entity";
import { logAction, logSuccess, logError } from "@workspace/logger";
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async findOne(usernameOrEmail: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: [{ email: usernameOrEmail }, { nom: usernameOrEmail }],
    });
  }

  async createUser(
    nom: string,
    email: string,
    plainPassword: string,
    role: UserRole = UserRole.USER,
  ): Promise<User> {
    logAction('ms-auth', `Creating user account: ${email}`);
    const mot_de_passe_hash = await bcrypt.hash(plainPassword, 10);

    const newUser: Partial<User> = {
      nom,
      email,
      mot_de_passe_hash,
      role,
      email_verifie: false,
      email_verification_token: randomUUID(),
    };

    const verificationMail = this.configService.get<string>("VERIFICATION_MAIL");
    const isVerificationDisabled = verificationMail?.toUpperCase() === "FALSE";

    if (isVerificationDisabled) {
      newUser.email_verification_token = null;
      newUser.email_verifie = true;
    }

    const user = this.usersRepository.create(newUser);
    try {
      const saved = await this.usersRepository.save(user);
      logSuccess('ms-auth', `User account created: ${email} (ID: ${saved.id})`);
      return saved;
    } catch (err: unknown) {
      const dbErr = err as { code?: string };
      if (dbErr?.code === '23505') {
        logError('ms-auth', `User creation failed: duplicate email - ${email}`);
        throw new RpcException({ message: 'Un compte existe déjà avec cet email.', statusCode: 409 });
      }
      logError('ms-auth', `User creation failed for ${email}`, undefined, err as Error);
      throw new RpcException({ message: 'Erreur lors de la création du compte.', statusCode: 500 });
    }
  }

  async confirmEmail(token: string): Promise<boolean> {
    logAction('ms-auth', `Confirming email with token`);
    const user = await this.usersRepository.findOne({
      where: { email_verification_token: token },
    });
    if (!user) {
      logError('ms-auth', `Email confirmation failed: invalid token`);
      return false;
    }
    user.email_verifie = true;
    user.email_verification_token = null;
    await this.usersRepository.save(user);
    logSuccess('ms-auth', `Email confirmed for user ${user.email}`);
    return true;
  }

  async issuePasswordResetToken(
    email: string,
    expiresInMinutes = 30,
  ): Promise<string | null> {
    logAction('ms-auth', `Issuing password reset token for ${email}`);
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      logError('ms-auth', `Password reset failed: user not found - ${email}`);
      return null;
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    user.rinitialiser_mdp_token_hash = tokenHash;
    user.reinitialiser_mdp_expires_at = new Date(
      Date.now() + expiresInMinutes * 60 * 1000,
    );

    await this.usersRepository.save(user);
    logSuccess('ms-auth', `Password reset token issued for ${email}`);
    return token;
  }

  async resetPasswordWithToken(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    logAction('ms-auth', `Resetting password with token`);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const user = await this.usersRepository.findOne({
      where: { rinitialiser_mdp_token_hash: tokenHash },
    });

    if (!user) {
      logError('ms-auth', `Password reset failed: invalid token`);
      return false;
    }
    if (!user.reinitialiser_mdp_expires_at) return false;
    if (user.reinitialiser_mdp_expires_at.getTime() < Date.now()) {
      logError('ms-auth', `Password reset failed: token expired`);
      return false;
    }

    user.mot_de_passe_hash = await bcrypt.hash(newPassword, 10);
    user.rinitialiser_mdp_token_hash = null;
    user.reinitialiser_mdp_expires_at = null;

    await this.usersRepository.save(user);
    logSuccess('ms-auth', `Password reset successfully for user ${user.email}`);
    return true;
  }

  async findProfileById(id: string) {
    return this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        email_verifie: true,
        cree_le: true,
      },
    });
  }
  async updateProfileNom(id: string, nom: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) return null;
    user.nom = nom;
    await this.usersRepository.save(user);
    return this.findProfileById(id);
  }

  async deleteAccount(id: string): Promise<boolean> {
    logAction('ms-auth', `Deleting account: ${id}`);
    const res = await this.usersRepository.delete({ id });
    const success = (res.affected ?? 0) > 0;
    if (success) {
      logSuccess('ms-auth', `Account deleted: ${id}`);
    } else {
      logError('ms-auth', `Account deletion failed: ${id}`);
    }
    return success;
  }

  async createGuestUser(displayName: string): Promise<User> {
    logAction('ms-auth', `Creating guest user: ${displayName}`);
    const guestId = randomUUID();
    const guestEmail = `guest_${guestId}@temp.local`;
    
    const newUser: Partial<User> = {
      nom: displayName,
      email: guestEmail,
      mot_de_passe_hash: '', // No password for guests
      role: UserRole.GUEST,
      email_verifie: true, // Bypass email verification for guests
      email_verification_token: null,
    };

    const user = this.usersRepository.create(newUser);
    try {
      const savedUser = await this.usersRepository.save(user);
      
      // CRITICAL: Verify user is visible across all database connections
      // This prevents FK constraint errors in other microservices due to transaction visibility lag
      const verifiedUser = await this.usersRepository.findOne({ 
        where: { id: savedUser.id } 
      });
      
      if (!verifiedUser) {
        logError('ms-auth', `Guest user verification failed for ${displayName}`);
        throw new RpcException({ 
          message: 'Guest user creation verification failed - user not found after save.', 
          statusCode: 500 
        });
      }
      
      logSuccess('ms-auth', `Guest user created: ${displayName} (ID: ${verifiedUser.id})`);
      return verifiedUser;
    } catch (err: unknown) {
      const dbErr = err as { code?: string };
      if (dbErr?.code === '23505') {
        logError('ms-auth', `Guest creation failed: duplicate email`);
        throw new RpcException({ message: 'Guest creation failed - duplicate email.', statusCode: 409 });
      }
      logError('ms-auth', `Guest creation failed for ${displayName}`, undefined, err as Error);
      throw new RpcException({ message: 'Guest creation failed.', statusCode: 500 });
    }
  }
}
