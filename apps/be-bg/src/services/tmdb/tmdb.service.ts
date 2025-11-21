import { Injectable } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { RedisService } from '../redis/redis.service';
import { DetailsFilm } from './types/tmdb.types';


@Injectable()
export class TmdbService {
    /** URL de base de l’API TMDB */
  private readonly urltmdb = 'https://api.themoviedb.org/3';

  constructor(private readonly redisService: RedisService) {}

  /**
   *  Recupere les details d un film.
   *  Verifie d abord dans Redis  
   *  Sinon, recupere depuis TMDB  
   *  Sauvegarde la réponse dans Redis  
   * @param id - Identifiant TMDB du film
   * @returns Détails du film
   */
  async obtenirDetailsFilm(id: number): Promise<DetailsFilm> {
    const cleCache = `tmdb:film:${id}`;
    console.log('TMDB_API_KEY =', process.env.TMDB_API_KEY);

    //Vérification dans Redis
    const enCache = await this.redisService.get<DetailsFilm>(cleCache);
    // Film trouve dans le cache on fait un return direct
    if (enCache){
        return enCache;
    } 

    // Requete TMDB
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
        affiche_url: reponse.data.poster_path,
        note_moyenne: reponse.data.vote_average,
      };

      // Mise en cache Redis 2h
      await this.redisService.set(cleCache, film, 7200);

      return film;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.status_message || 'Erreur TMDB';

        if (status === 404) {
          throw new HttpException('Film introuvable', HttpStatus.NOT_FOUND);
        }

        if (status === 401) {
          throw new HttpException('Clé TMDB invalide', HttpStatus.UNAUTHORIZED);
        }

        throw new HttpException(message, status || HttpStatus.INTERNAL_SERVER_ERROR);
      }
      console.error(error);
      // Pour toute autre erreur, renvoyer 500
      throw new HttpException(
        'Erreur lors de la récupération du film',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
