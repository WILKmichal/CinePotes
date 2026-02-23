import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { RedisService } from '../redis/redis.service';
import {
  DetailsFilm,
  DiscoverMovieParams,
  RechercheAvanceeFiltres,
  TmdbGenresResponse,
  TmdbListResponse,
  TmdbMovie,
  TmdbStatusMessage,
} from '../../../../types/library.types';

@Injectable()
export class LibraryService {
  private readonly urltmdb = 'https://api.themoviedb.org/3';
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

  constructor(private readonly redisService: RedisService) {}

  private buildPosterUrl(posterPath: string | null | undefined): string | null {
    if (!posterPath) return null;
    return `${this.imageBaseUrl}${posterPath}`;
  }

  /**Mapping centralisé (plus de any[]) */
  private mapperFilmsTmdb(results: TmdbMovie[]): DetailsFilm[] {
    return results.slice(0, 10).map((film) => ({
      id: film.id,
      titre: film.title,
      resume: film.overview ?? 'Pas de résumé disponible',
      date_sortie: film.release_date ?? '',
      affiche_url: this.buildPosterUrl(film.poster_path),
      note_moyenne: film.vote_average ?? 0,
    }));
  }

  /**Erreurs TMDB sans any */
  private handleTmdbError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const err = error as AxiosError<TmdbStatusMessage>;
      const status = err.response?.status;
      const message = err.response?.data?.status_message ?? 'Erreur library';

      if (status === 404) {
        throw new HttpException('Film introuvable', HttpStatus.NOT_FOUND);
      }
      if (status === 401) {
        throw new HttpException('Clé library invalide', HttpStatus.UNAUTHORIZED);
      }
      if (status === 429) {
        throw new HttpException(
          'Trop de requêtes (rate limit)',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        message,
        status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    console.error('library unknown error:', error);
    throw new HttpException(
      'Erreur lors de la communication avec library',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private async obtenirGenres(): Promise<Array<{ id: number; name: string }>> {
    const cleCache = 'library:genres:movie';

    const enCache =
      await this.redisService.get<Array<{ id: number; name: string }>>(
        cleCache,
      );
    if (enCache) return enCache;

    try {
      const reponse = await axios.get<TmdbGenresResponse>(
        `${this.urltmdb}/genre/movie/list`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'fr-FR',
          },
        },
      );

      const genres = reponse.data.genres ?? [];
      await this.redisService.set(cleCache, genres, 7200);
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

  async obtenirDetailsFilm(id: number): Promise<DetailsFilm> {
    const cleCache = `library:film:${id}`;

    const enCache = await this.redisService.get<DetailsFilm>(cleCache);
    if (enCache) return enCache;

    try {
      const reponse = await axios.get<TmdbMovie>(
        `${this.urltmdb}/movie/${id}`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'fr-FR',
          },
        },
      );

      const data = reponse.data;

      const film: DetailsFilm = {
        id: data.id,
        titre: data.title,
        resume: data.overview ?? '',
        date_sortie: data.release_date ?? '',
        affiche_url: this.buildPosterUrl(data.poster_path),
        note_moyenne: data.vote_average ?? 0,
      };

      await this.redisService.set(cleCache, film, 7200);
      return film;
    } catch (error) {
      this.handleTmdbError(error);
    }
  }

  async obtenirPlusieursFilms(ids: number[]): Promise<DetailsFilm[]> {
    return Promise.all(ids.map((id) => this.obtenirDetailsFilm(id)));
  }

  async obtenirFilmsPopulaires(): Promise<DetailsFilm[]> {
    const cleCache = 'library:films:populaires';

    const enCache = await this.redisService.get<DetailsFilm[]>(cleCache);
    if (enCache) return enCache;

    try {
      const reponse = await axios.get<TmdbListResponse<TmdbMovie>>(
        `${this.urltmdb}/movie/popular`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'fr-FR',
            page: 1,
          },
        },
      );

      const films = this.mapperFilmsTmdb(reponse.data.results);
      await this.redisService.set(cleCache, films, 7200);
      return films;
    } catch (error) {
      this.handleTmdbError(error);
    }
  }

  async rechercherFilms(query: string): Promise<DetailsFilm[]> {
    const requete = query.toLowerCase().trim();
    const cleCache = `library:recherche:${requete}`;

    const enCache = await this.redisService.get<DetailsFilm[]>(cleCache);
    if (enCache) return enCache;

    try {
      const reponse = await axios.get<TmdbListResponse<TmdbMovie>>(
        `${this.urltmdb}/search/movie`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'fr-FR',
            query,
            page: 1,
          },
        },
      );

      const films = this.mapperFilmsTmdb(reponse.data.results);
      await this.redisService.set(cleCache, films, 7200);
      return films;
    } catch (error) {
      this.handleTmdbError(error);
    }
  }

  async rechercherFilmsAvancee(
    filtres: RechercheAvanceeFiltres,
  ): Promise<DetailsFilm[]> {
    const titre = filtres.titre?.trim();
    const annee = filtres.annee?.trim();
    const genre = filtres.genre?.trim();

    const cleCache = `library:recherche_avancee:${JSON.stringify({
      titre: titre || '',
      annee: annee || '',
      genre: genre || '',
    })}`;

    const enCache = await this.redisService.get<DetailsFilm[]>(cleCache);
    if (enCache) return enCache;

    try {
      // 1) Si on a un titre -> search/movie (+ filtre année côté TMDB)
      if (titre) {
        const reponse = await axios.get<TmdbListResponse<TmdbMovie>>(
          `${this.urltmdb}/search/movie`,
          {
            params: {
              api_key: process.env.TMDB_API_KEY,
              language: 'fr-FR',
              query: titre,
              page: 1,
              ...(annee ? { primary_release_year: annee } : {}),
            },
          },
        );

        let results: TmdbMovie[] = reponse.data.results ?? [];

        // Filtre genre (côté Node) si demandé
        if (genre) {
          const genreId = await this.trouverGenreIdParNom(genre);
          if (!genreId) {
            await this.redisService.set(cleCache, [], 7200);
            return [];
          }
          results = results.filter((m) =>
            (m.genre_ids ?? []).includes(genreId),
          );
        }

        const films = this.mapperFilmsTmdb(results);
        await this.redisService.set(cleCache, films, 7200);
        return films;
      }

      // 2) Sans titre -> discover/movie (genre/année)
      const params: DiscoverMovieParams = {
        api_key: process.env.TMDB_API_KEY ?? '',
        language: 'fr-FR',
        sort_by: 'popularity.desc',
        page: 1,
      };

      if (annee) params.primary_release_year = annee;

      if (genre) {
        const genreId = await this.trouverGenreIdParNom(genre);
        if (!genreId) {
          await this.redisService.set(cleCache, [], 7200);
          return [];
        }
        params.with_genres = genreId;
      }

      const reponse = await axios.get<TmdbListResponse<TmdbMovie>>(
        `${this.urltmdb}/discover/movie`,
        {
          params,
        },
      );

      const films = this.mapperFilmsTmdb(reponse.data.results ?? []);
      await this.redisService.set(cleCache, films, 7200);
      return films;
    } catch (error) {
      this.handleTmdbError(error);
    }
  }
}
