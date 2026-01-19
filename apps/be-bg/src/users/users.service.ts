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
   */
  async findOne(usernameOrEmail: string): Promise<User | undefined> {
    const text = `
      SELECT id AS "userId", nom, email, mot_de_passe_hash, role
      FROM "Utilisateur"
      WHERE email = $1 OR nom = $1
      LIMIT 1
    `;
    try {
      const res = await this.pool.query(text, [usernameOrEmail]);
      if (res.rowCount === 0) return undefined;
      return res.rows[0] as User;
    } catch (err) {
      this.logger.debug(
        'Première requête échouée, tentative sans guillemets (lowercase)',
      );
      try {
        const res2 = await this.pool.query(
          `SELECT id AS "userId", nom, email, mot_de_passe_hash, role
           FROM utilisateur
           WHERE email = $1 OR nom = $1
           LIMIT 1`,
          [usernameOrEmail],
        );
        if (res2.rowCount === 0) return undefined;
        return res2.rows[0] as User;
      } catch (err2) {
        this.logger.error(
          "Erreur DB lors de la recherche d'un utilisateur",
          err2,
        );
        throw err2;
      }
    }
  }

  /**
   * Crée un nouvel utilisateur (hachage du mot de passe).
   * Retourne l'utilisateur inséré (sans le hash si besoin).
   */
  async createUser(
    nom: string,
    email: string,
    plainPassword: string,
    role = 'user',
  ) {
    // Hash
    const hash = await bcrypt.hash(plainPassword, 10);

    // Essayer avec "Utilisateur" puis fallback sur utilisateur
    const insertQuoted = `
      INSERT INTO "Utilisateur" (nom, email, mot_de_passe_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id AS "userId", nom, email, role, cree_le
    `;

    const insertLower = `
      INSERT INTO utilisateur (nom, email, mot_de_passe_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id AS "userId", nom, email, role, cree_le
    `;

    try {
      const res = await this.pool.query(insertQuoted, [nom, email, hash, role]);
      return res.rows[0];
    } catch (err) {
      this.logger.debug(
        'Insert quoted failed, try lowercase',
        err?.message ?? err,
      );
      try {
        const res2 = await this.pool.query(insertLower, [
          nom,
          email,
          hash,
          role,
        ]);
        return res2.rows[0];
      } catch (err2) {
        this.logger.error("Erreur lors de la création d'utilisateur", err2);
        throw err2;
      }
    }
  }
}
