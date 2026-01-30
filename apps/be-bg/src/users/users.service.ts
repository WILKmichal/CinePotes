import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Trouver un utilisateur par email OU nom
   */
  async findOne(usernameOrEmail: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: [
        { email: usernameOrEmail },
        { nom: usernameOrEmail },
      ],
    });
  }

  /**
   * Création d’un utilisateur (email non vérifié)
   */
  async createUser(
    nom: string,
    email: string,
    plainPassword: string,
    role: UserRole = UserRole.USER,
  ): Promise<User> {
    const mot_de_passe_hash = await bcrypt.hash(plainPassword, 10);
    const isTestEnv = process.env.NODE_ENV === "test"

    const user = this.usersRepository.create({
      nom,
      email,
      mot_de_passe_hash,
      role,
      email_verifie: isTestEnv ? true : false,
      email_verification_token: isTestEnv ? null : randomUUID(),
    });

    return this.usersRepository.save(user);
  }

  /**
   * Confirmation d’email
   */
  async confirmEmail(token: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { email_verification_token: token },
    });

    if (!user) {
      return false;
    }

    user.email_verifie = true;
    user.email_verification_token = null;

    await this.usersRepository.save(user);
    return true;
  }
}
