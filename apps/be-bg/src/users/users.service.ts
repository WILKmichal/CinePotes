import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../database/database.module';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export type User = {
  userId: string;
  nom?: string;
  email: string;
  mot_de_passe_hash: string;
  role?: string;
  email_verifie: boolean;
  email_verification_token?: string;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findOne(usernameOrEmail: string): Promise<User | undefined> {
    const queries = [
      `
      SELECT id AS "userId", nom, email, mot_de_passe_hash, role,
             email_verifie, email_verification_token
      FROM utilisateur
      WHERE email = $1 OR nom = $1
      LIMIT 1
      `,
    ];

    for (const query of queries) {
      try {
        const res = await this.pool.query(query, [usernameOrEmail]);
        if (res.rowCount && res.rowCount > 0) {
          return res.rows[0];
        }
      } catch (e) {
        this.logger.debug('Query failed', e);
      }
    }

    return undefined;
  }

  async createUser(
    nom: string,
    email: string,
    plainPassword: string,
    role = 'user',
  ) {
    const hash = await bcrypt.hash(plainPassword, 10);
    const token = randomUUID();

    const res = await this.pool.query(
      `
      INSERT INTO utilisateur
      (nom, email, mot_de_passe_hash, role, email_verifie, email_verification_token)
      VALUES ($1, $2, $3, $4, false, $5)
      RETURNING id AS "userId", nom, email, role, email_verification_token
      `,
      [nom, email, hash, role, token],
    );

    return res.rows[0];
  }

  async confirmEmail(token: string): Promise<boolean> {
    const res = await this.pool.query(
      `
      UPDATE utilisateur
      SET email_verifie = true,
          email_verification_token = NULL
      WHERE email_verification_token = $1
      `,
      [token],
    );

    return res.rowCount === 1;
  }
}
