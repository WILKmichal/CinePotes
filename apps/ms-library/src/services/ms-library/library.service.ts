import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { logExternalApi, logSuccess, logError, logCustom, LOG_EMOJI } from '@workspace/logger';

@Injectable()
export class LibraryService {
  // Base URL TMDB (API REST publique)
  private readonly urltmdb = 'https://api.themoviedb.org/3';
  // Base URL pour construire les URLs d'affiches
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
  private readonly tmdbApiKey: string;

  // Redis est utilisé comme cache pour éviter des appels TMDB répétés.
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.tmdbApiKey = this.configService.getOrThrow<string>('TMDB_API_KEY');
  }

  // Transforme un poster_path TMDB en URL complète exploitable par le front.
  private buildPosterUrl(posterPath: string | null | undefined): string | null {
    // Traitement:
    // concatène la base image + poster_path mais si posterpath est null on retourne null pour éviter une URL cassée. 
    // TMDB peut parfois ne pas fournir de poster_path.
    if (!posterPath) return null;
    return `${this.imageBaseUrl}${posterPath}`;
  }

  // Mapping centralisé TMDB -> modèle applicatif DetailsFilm.
  // On limite volontairement à 10 éléments pour les endpoints liste/recherche.
  private mapperFilmsTmdb(results: TmdbMovie[]): DetailsFilm[] {
    // Traitement:
    // 1) coupe le tableau TMDB à 10 résultats max
    // 2) transforme chaque film au format interne DetailsFilm
    // 3) applique des valeurs par défaut pour les champs manquants
    return results.slice(0, 10).map((film) => ({
      id: film.id,
      titre: film.title,
      resume: film.overview ?? 'Pas de résumé disponible',
      date_sortie: film.release_date ?? '',
      affiche_url: this.buildPosterUrl(film.poster_path),
      note_moyenne: film.vote_average ?? 0,
    }));
  }

  // Normalise les erreurs axios/TMDB en HttpException NestJS avec status cohérent.
  private handleTmdbError(error: unknown, requestId?: string): never {
    // Traitement:
    // si erreur Axios => lit status + message TMDB
    // mappe certains status connus (404/401/429)
    // sinon renvoie une erreur HTTP générique
    if (axios.isAxiosError(error)) {
      const err = error as AxiosError<TmdbStatusMessage>;
      const status = err.response?.status;
      const message = err.response?.data?.status_message ?? 'Erreur library';

      if (status === 404) {
        logError('ms-library', 'TMDB API - Film not found (404)', requestId);
        throw new HttpException('Film introuvable', HttpStatus.NOT_FOUND);
      }
      if (status === 401) {
        logError('ms-library', 'TMDB API - Invalid API key (401)', requestId);
        throw new HttpException(
          'Clé library invalide',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (status === 429) {
        logError('ms-library', 'TMDB API - Rate limit exceeded (429)', requestId);
        throw new HttpException(
          'Trop de requêtes (rate limit)',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      logError('ms-library', `TMDB API error (${status}): ${message}`, requestId);
      throw new HttpException(
        message,
        status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    logError('ms-library', 'TMDB unknown error', requestId, error);
    throw new HttpException(
      'Erreur lors de la communication avec library',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  // Charge la liste des genres TMDB (avec cache Redis 2h).
  // Sert à convertir un nom de genre ("Action") en identifiant TMDB.
  private async obtenirGenres(): Promise<Array<{ id: number; name: string }>> {
    const cleCache = 'library:genres:movie';

    // tente de lire dans le cache
    const enCache =
      await this.redisService.get<Array<{ id: number; name: string }>>(
        cleCache,
      );
    if (enCache) return enCache;

    try {
      // sinon appelle TMDB /genre/movie/list
      const reponse = await axios.get<TmdbGenresResponse>(
        `${this.urltmdb}/genre/movie/list`,
        {
          params: {
            api_key: this.tmdbApiKey,
            language: 'fr-FR',
          },
        },
      );

      // stocke en cache (TTL 7200s = 2h) puis retourne
      const genres = reponse.data.genres ?? [];
      await this.redisService.set(cleCache, genres, 7200);
      return genres;
    } catch (error) {
      this.handleTmdbError(error);
    }
  }

  // Convertit un nom de genre en ID TMDB, ou null si introuvable.
  private async trouverGenreIdParNom(genreNom: string): Promise<number | null> {
    // charge la liste des genres (cache + TMDB si nécessaire)
    // compare en minuscules pour une recherche insensible à la casse
    // retourne l'ID trouvé, sinon null
    const genres = await this.obtenirGenres();
    const g = genres.find(
      (x) => x.name.toLowerCase() === genreNom.toLowerCase(),
    );
    return g ? g.id : null;
  }

  // Détail d'un film unique:
  // lecture cache
  // fallback TMDB /movie/:id
  // réécriture cache
  async obtenirDetailsFilm(id: number, requestId?: string): Promise<DetailsFilm> {
    const cleCache = `library:film:${id}`;

    // 1) lecture cache
    const enCache = await this.redisService.get<DetailsFilm>(cleCache);
    if (enCache) {
      logCustom(LOG_EMOJI.REDIS, 'ms-library', `Cache hit for movie ID: ${id}`, requestId);
      return enCache;
    }

    try {
      // 2) appel TMDB si cache manquant
      logExternalApi('ms-library', 'TMDB', `/movie/${id}`, requestId);
      const reponse = await axios.get<TmdbMovie>(
        `${this.urltmdb}/movie/${id}`,
        {
          params: {
            api_key: this.tmdbApiKey,
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

      // 3) mise en cache du résultat puis retour au caller
      await this.redisService.set(cleCache, film, 7200);
      logCustom(LOG_EMOJI.REDIS, 'ms-library', `Cached movie ID: ${id}`, requestId);
      return film;
    } catch (error) {
      this.handleTmdbError(error, requestId);
    }
  }

  // Récupère plusieurs détails en parallèle (Promise.all).
  async obtenirPlusieursFilms(ids: number[], requestId?: string): Promise<DetailsFilm[]> {
    // Traitement: exécute obtenirDetailsFilm(id) pour chaque id en parallèle.
    return Promise.all(ids.map((id) => this.obtenirDetailsFilm(id, requestId)));
  }

  // Liste des films populaires TMDB (cache 2h).
  async obtenirFilmsPopulaires(requestId?: string): Promise<DetailsFilm[]> {
    const cleCache = 'library:films:populaires';

    // tente le cache
    const enCache = await this.redisService.get<DetailsFilm[]>(cleCache);
    if (enCache) {
      logCustom(LOG_EMOJI.REDIS, 'ms-library', 'Cache hit for popular movies', requestId);
      return enCache;
    }

    try {
      // appelle TMDB /movie/popular
      logExternalApi('ms-library', 'TMDB', '/movie/popular', requestId);
      const reponse = await axios.get<TmdbListResponse<TmdbMovie>>(
        `${this.urltmdb}/movie/popular`,
        {
          params: {
            api_key: this.tmdbApiKey,
            language: 'fr-FR',
            page: 1,
          },
        },
      );

      // mappe, cache puis retourne
      const films = this.mapperFilmsTmdb(reponse.data.results);
      await this.redisService.set(cleCache, films, 7200);
      logCustom(LOG_EMOJI.REDIS, 'ms-library', 'Cached popular movies', requestId);
      return films;
    } catch (error) {
      this.handleTmdbError(error, requestId);
    }
  }

  // Recherche texte simple sur /search/movie (cache 2h par requête normalisée).
  async rechercherFilms(query: string, requestId?: string): Promise<DetailsFilm[]> {
    // Normalisation de la requête pour stabiliser la clé cache.
    const requete = query.toLowerCase().trim();
    const cleCache = `library:recherche:${requete}`;

    // lecture cache
    const enCache = await this.redisService.get<DetailsFilm[]>(cleCache);
    if (enCache) {
      logCustom(LOG_EMOJI.REDIS, 'ms-library', `Cache hit for search: ${query}`, requestId);
      return enCache;
    }

    try {
      // appel TMDB /search/movie
      logExternalApi('ms-library', 'TMDB', `/search/movie?query=${query}`, requestId);
      const reponse = await axios.get<TmdbListResponse<TmdbMovie>>(
        `${this.urltmdb}/search/movie`,
        {
          params: {
            api_key: this.tmdbApiKey,
            language: 'fr-FR',
            query,
            page: 1,
          },
        },
      );

      // mappe, cache puis retourne
      const films = this.mapperFilmsTmdb(reponse.data.results);
      await this.redisService.set(cleCache, films, 7200);
      logCustom(LOG_EMOJI.REDIS, 'ms-library', `Cached search results: ${query}`, requestId);
      return films;
    } catch (error) {
      this.handleTmdbError(error, requestId);
    }
  }

  // Recherche avancée:
  // avec titre: /search/movie (+ éventuel filtre année), puis filtre genre 
  // sans titre: /discover/movie avec filtres genre/année côté TMDB
  async rechercherFilmsAvancee(
    filtres: RechercheAvanceeFiltres,
    requestId?: string,
  ): Promise<DetailsFilm[]> {
    // On normalise les filtres d'entrée
    const titre = filtres.titre?.trim();
    const annee = filtres.annee?.trim();
    const genre = filtres.genre?.trim();

    const cleCache = `library:recherche_avancee:${JSON.stringify({
      titre: titre || '',
      annee: annee || '',
      genre: genre || '',
    })}`;

    // lecture cache selon la combinaison de filtres
    const enCache = await this.redisService.get<DetailsFilm[]>(cleCache);
    if (enCache) {
      logCustom(LOG_EMOJI.REDIS, 'ms-library', 'Cache hit for advanced search', requestId);
      return enCache;
    }

    try {
      // 1) Cas "titre renseigné" : endpoint search
      if (titre) {
        logExternalApi('ms-library', 'TMDB', `/search/movie (advanced)`, requestId);
        const reponse = await axios.get<TmdbListResponse<TmdbMovie>>(
          `${this.urltmdb}/search/movie`,
          {
            params: {
              api_key: this.tmdbApiKey,
              language: 'fr-FR',
              query: titre,
              page: 1,
              ...(annee ? { primary_release_year: annee } : {}),
            },
          },
        );

        let results: TmdbMovie[] = reponse.data.results ?? [];

        // Filtre genre côté backend (search/movie n'est pas fiable pour ce filtre via query)
        if (genre) {
          // Convertit le nom de genre en ID TMDB
          const genreId = await this.trouverGenreIdParNom(genre);
          if (!genreId) {
            // Genre inconnu: on cache la réponse vide pour éviter de recalculer.
            await this.redisService.set(cleCache, [], 7200);
            return [];
          }
          results = results.filter((m) =>
            (m.genre_ids ?? []).includes(genreId),
          );
        }

        // Mapping + cache + retour
        const films = this.mapperFilmsTmdb(results);
        await this.redisService.set(cleCache, films, 7200);
        logCustom(LOG_EMOJI.REDIS, 'ms-library', 'Cached advanced search results', requestId);
        return films;
      }

      // 2) Cas "sans titre" : endpoint discover avec paramètres structurés
      const params: DiscoverMovieParams = {
        api_key: this.tmdbApiKey,
        language: 'fr-FR',
        sort_by: 'popularity.desc',
        page: 1,
      };

      if (annee) params.primary_release_year = annee;

      if (genre) {
        // Même logique de conversion nom de genre -> ID TMDB
        const genreId = await this.trouverGenreIdParNom(genre);
        if (!genreId) {
          await this.redisService.set(cleCache, [], 7200);
          return [];
        }
        params.with_genres = genreId;
      }

      logExternalApi('ms-library', 'TMDB', '/discover/movie', requestId);
      const reponse = await axios.get<TmdbListResponse<TmdbMovie>>(
        `${this.urltmdb}/discover/movie`,
        {
          params,
        },
      );

      // Mapping + cache + retour
      const films = this.mapperFilmsTmdb(reponse.data.results ?? []);
      await this.redisService.set(cleCache, films, 7200);
      logCustom(LOG_EMOJI.REDIS, 'ms-library', 'Cached discover results', requestId);
      return films;
    } catch (error) {
      this.handleTmdbError(error, requestId);
    }
  }
}
