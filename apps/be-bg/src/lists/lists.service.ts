import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../database/database.module';

export type Liste = {
  id: string;
  nom: string;
  description?: string;
  utilisateur_id: string;
  cree_le: Date;
  maj_le: Date;
};

export type ListeFilm = {
  id: string;
  liste_id: string;
  tmdb_id: number;
  cree_le: Date;
};

@Injectable()
export class ListsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /**
   * Récupère toutes les listes d'un utilisateur
   */
  async findAllByUser(userId: string): Promise<Liste[]> {
    const query = `
      SELECT id, nom, description, utilisateur_id, cree_le, maj_le
      FROM liste
      WHERE utilisateur_id = $1
      ORDER BY cree_le DESC
    `;
    const res = await this.pool.query<Liste>(query, [userId]);
    return res.rows;
  }

  /**
   * Récupère une liste par son ID (vérifie qu'elle appartient à l'utilisateur)
   */
  async findOne(listeId: string, userId: string): Promise<Liste | undefined> {
    const query = `
      SELECT id, nom, description, utilisateur_id, cree_le, maj_le
      FROM liste
      WHERE id = $1 AND utilisateur_id = $2
    `;
    const res = await this.pool.query<Liste>(query, [listeId, userId]);
    return res.rows[0];
  }

  /**
   * Crée une nouvelle liste pour un utilisateur
   */
  async create(
    userId: string,
    nom: string,
    description?: string,
  ): Promise<Liste> {
    const query = `
      INSERT INTO liste (nom, description, utilisateur_id)
      VALUES ($1, $2, $3)
      RETURNING id, nom, description, utilisateur_id, cree_le, maj_le
    `;
    const res = await this.pool.query<Liste>(query, [
      nom,
      description || null,
      userId,
    ]);
    return res.rows[0];
  }

  /**
   * Supprime une liste (et ses films associés via CASCADE)
   */
  async delete(listeId: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM liste
      WHERE id = $1 AND utilisateur_id = $2
    `;
    const res = await this.pool.query(query, [listeId, userId]);
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Ajoute un film (par tmdb_id) à une liste
   */
  async addFilmToList(
    listeId: string,
    tmdbId: number,
    userId: string,
  ): Promise<ListeFilm | null> {
    // Vérifie que la liste appartient à l'utilisateur
    const liste = await this.findOne(listeId, userId);
    if (!liste) {
      return null;
    }

    const query = `
      INSERT INTO listefilm (liste_id, tmdb_id)
      VALUES ($1, $2)
      ON CONFLICT (liste_id, tmdb_id) DO NOTHING
      RETURNING id, liste_id, tmdb_id, cree_le
    `;
    const res = await this.pool.query<ListeFilm>(query, [listeId, tmdbId]);
    return (
      res.rows[0] || {
        id: '',
        liste_id: listeId,
        tmdb_id: tmdbId,
        cree_le: new Date(),
      }
    );
  }

  /**
   * Retire un film d'une liste
   */
  async removeFilmFromList(
    listeId: string,
    tmdbId: number,
    userId: string,
  ): Promise<boolean> {
    // Vérifie que la liste appartient à l'utilisateur
    const liste = await this.findOne(listeId, userId);
    if (!liste) {
      return false;
    }

    const query = `
      DELETE FROM listefilm
      WHERE liste_id = $1 AND tmdb_id = $2
    `;
    const res = await this.pool.query(query, [listeId, tmdbId]);
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Récupère tous les films (tmdb_ids) d'une liste
   */
  async getFilmsInList(listeId: string, userId: string): Promise<number[]> {
    // Vérifie que la liste appartient à l'utilisateur
    const liste = await this.findOne(listeId, userId);
    if (!liste) {
      return [];
    }

    const query = `
      SELECT tmdb_id
      FROM listefilm
      WHERE liste_id = $1
      ORDER BY cree_le DESC
    `;
    const res = await this.pool.query<{ tmdb_id: number }>(query, [listeId]);
    return res.rows.map((row) => row.tmdb_id);
  }

  /**
   * Récupère toutes les listes d'un utilisateur avec leurs films
   */
  async findAllByUserWithFilms(
    userId: string,
  ): Promise<(Liste & { films: number[] })[]> {
    const listes = await this.findAllByUser(userId);
    const result: (Liste & { films: number[] })[] = [];

    for (const liste of listes) {
      const films = await this.getFilmsInList(liste.id, userId);
      result.push({ ...liste, films });
    }

    return result;
  }
}
