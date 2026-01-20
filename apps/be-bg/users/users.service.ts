import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import * as bcrypt from 'bcryptjs';

export type User = {
  userId: string;
  nom?: string;
  email: string;
  mot_de_passe_hash: string;
  role?: string;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /**
   * Trouve un utilisateur par email OU nom.
   * Retourne undefined si non trouvé (PAS d'exception ici).
   */
  async findOne(usernameOrEmail: string): Promise<User | undefined> {
    const queries = [
      `
        SELECT id AS "userId", nom, email, mot_de_passe_hash, role
        FROM "Utilisateur"
        WHERE email = $1 OR nom = $1
        LIMIT 1
      `,
      `
        SELECT id AS "userId", nom, email, mot_de_passe_hash, role
        FROM utilisateur
        WHERE email = $1 OR nom = $1
        LIMIT 1
      `,
    ];

    for (const query of queries) {
      try {
        const res = await this.pool.query(query, [usernameOrEmail]);
        if (res.rowCount && res.rowCount > 0) {
          return res.rows[0] as User;
        }
      } catch (error) {
        // Log uniquement, on tente le fallback
        this.logger.debug('Query failed, trying fallback', error); // NOSONAR
      }
    }

    return undefined;
  }

  /**
   * Crée un nouvel utilisateur (hachage du mot de passe).
   */
  async createUser(
    nom: string,
    email: string,
    plainPassword: string,
    role = 'user',
  ) {
    const hash = await bcrypt.hash(plainPassword, 10);

    const queries = [
      `
        INSERT INTO "Utilisateur" (nom, email, mot_de_passe_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id AS "userId", nom, email, role, cree_le
      `,
      `
        INSERT INTO utilisateur (nom, email, mot_de_passe_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id AS "userId", nom, email, role, cree_le
      `,
    ];

    for (const query of queries) {
      try {
        const res = await this.pool.query(query, [
          nom,
          email,
          hash,
          role,
        ]);
        return res.rows[0];
      } catch (error) {
        this.logger.debug('Insert failed, trying fallback', error); // NOSONAR
      }
    }

    // Si TOUT échoue → vraie erreur serveur
    this.logger.error("Impossible de créer l'utilisateur");
    throw new Error('Database error while creating user');
  }
}
