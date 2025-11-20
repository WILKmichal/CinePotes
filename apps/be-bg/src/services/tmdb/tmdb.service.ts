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

    // 📌 Vérification dans Redis
    const enCache = await this.redisService.get<DetailsFilm>(cleCache);
    // Film trouve dans le cache on fait un return direct
    if (enCache){
        return enCache;
    } 

    // Requete TMDB
    try {
      const reponse = await axios.get(`${this.urltmdb}/movie/${id}`, {
        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        params: { language: 'fr-FR' },
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
    } catch {
      throw new HttpException('Film introuvable', HttpStatus.NOT_FOUND);
    }
  }
}
