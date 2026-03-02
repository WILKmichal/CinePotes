import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { User, UserRole } from 'schemas/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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
    const mot_de_passe_hash = await bcrypt.hash(plainPassword, 10);

    const newUser: Partial<User> = {
      nom,
      email,
      mot_de_passe_hash,
      role,
      email_verifie: false,
      email_verification_token: randomUUID(),
    };

    if (process.env.VERIFICATION_MAIL === 'FALSE') {
      newUser.email_verification_token = null;
      newUser.email_verifie = true;
    }

    const user = this.usersRepository.create(newUser);
    return this.usersRepository.save(user);
  }

  async confirmEmail(token: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { email_verification_token: token },
    });
    if (!user) return false;
    user.email_verifie = true;
    user.email_verification_token = null;
    await this.usersRepository.save(user);
    return true;
  }

  async issuePasswordResetToken(email: string, expiresInMinutes = 30): Promise<string | null> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return null;

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    user.rinitialiser_mdp_token_hash = tokenHash;
    user.reinitialiser_mdp_expires_at = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.usersRepository.save(user);
    return token;
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.usersRepository.findOne({ where: { rinitialiser_mdp_token_hash: tokenHash } });

    if (!user) return false;
    if (!user.reinitialiser_mdp_expires_at) return false;
    if (user.reinitialiser_mdp_expires_at.getTime() < Date.now()) return false;

    user.mot_de_passe_hash = await bcrypt.hash(newPassword, 10);
    user.rinitialiser_mdp_token_hash = null;
    user.reinitialiser_mdp_expires_at = null;

    await this.usersRepository.save(user);
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
}
