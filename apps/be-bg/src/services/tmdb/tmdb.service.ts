import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { RedisService } from '../redis/redis.service';
import { DetailsFilm } from './types/tmdb.types';

@Injectable()
export class TmdbService {
  /** URL de base de l’API TMDB */
  private readonly urltmdb = 'https://api.themoviedb.org/3';

  /** Base URL pour les images TMDB */
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Construit l'URL complète de l'affiche
   */
  private buildPosterUrl(
    posterPath: string | null | undefined,
  ): string | null {
    if (!posterPath) return null;
    return `${this.imageBaseUrl}${posterPath}`;
  }

  /**
   * Gestion centralisée des erreurs TMDB
   */
  private handleTmdbError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data: any = error.response?.data;
      const message = data?.status_message || 'Erreur TMDB';

      if (status === 404) {
        throw new HttpException('Film introuvable', HttpStatus.NOT_FOUND);
      }
      if (status === 401) {
        throw new HttpException('Clé TMDB invalide', HttpStatus.UNAUTHORIZED);
      }
      if (status === 429) {
        throw new HttpException(
          'Trop de requêtes (rate limit)',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        message,
        status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    console.error('TMDB unknown error:', error);
    throw new HttpException(
      'Erreur lors de la communication avec TMDB',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  private mapperFilmsTmdb(results: any[]): DetailsFilm[] {
  return results.slice(0, 10).map((film) => ({
    id: film.id,
    titre: film.title,
    resume: film.overview || 'Pas de résumé disponible',
    date_sortie: film.release_date || '',
    affiche_url: this.buildPosterUrl(film.poster_path),
    note_moyenne: film.vote_average || 0,
  }));
}

  private async obtenirGenres(): Promise<{ id: number; name: string }[]> {
    const cleCache = 'tmdb:genres:movie';

    const enCache = await this.redisService.get<{ id: number; name: string }[]>(cleCache);
    if (enCache) return enCache;

    try {
      const reponse = await axios.get(`${this.urltmdb}/genre/movie/list`, {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'fr-FR',
        },
      });

      const genres = (reponse.data?.genres ?? []) as { id: number; name: string }[];
      await this.redisService.set(cleCache, genres, 86400); // 24h
      return genres;
    } catch (error) {
      this.handleTmdbError(error);
    }
  }

  private async trouverGenreIdParNom(genreNom: string): Promise<number | null> {
    const genres = await this.obtenirGenres();
    const g = genres.find(
      (x) => x.name.toLowerCase() === genreNom.toLowerCase(),
    );
    return g ? g.id : null;
  }
  /**
   * Détails d'un film
   */
  async obtenirDetailsFilm(id: number): Promise<DetailsFilm> {
    const cleCache = `tmdb:film:${id}`;

    const enCache = await this.redisService.get<DetailsFilm>(cleCache);
    if (enCache) return enCache;

    try {
      const reponse = await axios.get(`${this.urltmdb}/movie/${id}`, {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'fr-FR',
        },
      });

      const film: DetailsFilm = {
        id: reponse.data.id,
        titre: reponse.data.title,
        resume: reponse.data.overview,
        date_sortie: reponse.data.release_date,
        affiche_url: this.buildPosterUrl(reponse.data.poster_path),
        note_moyenne: reponse.data.vote_average,
      };

      await this.redisService.set(cleCache, film, 7200);
      return film;
    } catch (error) {
      this.handleTmdbError(error);
    }
  }

  /**
   * Plusieurs films
   */
  async obtenirPlusieursFilms(ids: number[]): Promise<DetailsFilm[]> {
    return Promise.all(ids.map((id) => this.obtenirDetailsFilm(id)));
  }

  /**
   * Films populaires
   */
  async obtenirFilmsPopulaires(): Promise<DetailsFilm[]> {
    const cleCache = 'tmdb:films:populaires';

    const enCache = await this.redisService.get<DetailsFilm[]>(cleCache);
    if (enCache) return enCache;

    try {
      const reponse = await axios.get(`${this.urltmdb}/movie/popular`, {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'fr-FR',
          page: 1,
        },
      });

      const films: DetailsFilm[] = reponse.data.results.map((film) => ({
        id: film.id,
        titre: film.title,
        resume: film.overview,
        date_sortie: film.release_date,
        affiche_url: this.buildPosterUrl(film.poster_path),
        note_moyenne: film.vote_average,
      }));

      await this.redisService.set(cleCache, films, 7200);
      return films;
    } catch (error) {
      this.handleTmdbError(error);
    }
  }

  /**
   * Recherche de films
   */
  async rechercherFilms(query: string): Promise<DetailsFilm[]> {
    const requete = query.toLowerCase().trim();
    const cleCache = `tmdb:recherche:${requete}`;

    const enCache = await this.redisService.get<DetailsFilm[]>(cleCache);
    if (enCache) return enCache;

    try {
      const reponse = await axios.get(`${this.urltmdb}/search/movie`, {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'fr-FR',
          query,
          page: 1,
        },
      });

      const films: DetailsFilm[] = reponse.data.results
        .slice(0, 10)
        .map((film) => ({
          id: film.id,
          titre: film.title,
          resume: film.overview || 'Pas de résumé disponible',
          date_sortie: film.release_date || '',
          affiche_url: this.buildPosterUrl(film.poster_path),
          note_moyenne: film.vote_average || 0,
        }));

      await this.redisService.set(cleCache, films, 3600);
      return films;
    } catch (error) {
      this.handleTmdbError(error);
    }
  }
    async rechercherFilmsAvancee(filtres: {titre?: string; annee?: string;genre?: string;}): Promise<DetailsFilm[]> {

    const { titre, annee, genre } = filtres;

    const cleCache = `tmdb:recherche_avancee:${JSON.stringify({
      titre: titre || '',
      annee: annee || '',
      genre: genre || '',
    })}`;

    const enCache = await this.redisService.get<DetailsFilm[]>(cleCache);
    if (enCache) return enCache;

    try {
      // Recherche par titre
      if (titre) {
        const response = await axios.get(`${this.urltmdb}/search/movie`, {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'fr-FR',
            query: titre,
            page: 1,
            ...(annee ? { primary_release_year: annee } : {}),
          },
        });

        let results = response.data?.results ?? [];

        // filtre genre si fourni
        if (genre) {
          const genreId = await this.trouverGenreIdParNom(genre);
          if (!genreId) {
            await this.redisService.set(cleCache, [], 600);
            return [];
          }
          results = results.filter((m) =>
            (m.genre_ids ?? []).includes(genreId),
          );
        }

        const films = this.mapperFilmsTmdb(results);
        await this.redisService.set(cleCache, films, 1800);
        return films;
      }

      // Recherche sans titre (genre / année)
      const params: any = {
        api_key: process.env.TMDB_API_KEY,
        language: 'fr-FR',
        sort_by: 'popularity.desc',
        page: 1,
      };

      if (annee) params.primary_release_year = annee;

      if (genre) {
        const genreId = await this.trouverGenreIdParNom(genre);
        if (!genreId) {
          await this.redisService.set(cleCache, [], 600);
          return [];
        }
        params.with_genres = genreId;
      }

      const response = await axios.get(
        `${this.urltmdb}/discover/movie`,
        { params },
      );

      const films = this.mapperFilmsTmdb(response.data?.results ?? []);
      await this.redisService.set(cleCache, films, 1800);
      return films;

    } catch (error) {
      this.handleTmdbError(error);
    }
  }
}