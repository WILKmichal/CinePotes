import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TmdbService } from './library.service';
import { DetailsFilm } from '../../../../types/tmdb.types';

@Controller()
export class TmdbNatsController {
  constructor(private readonly tmdb: TmdbService) {}

  @MessagePattern('tmdb.details')
  obtenirDetails(@Payload() data: { id: number }) {
    return this.tmdb.obtenirDetailsFilm(data.id);
  }

  @MessagePattern('tmdb.movies')
  obtenirMovies(@Payload() data: { ids: number[] }): Promise<DetailsFilm[]> {
    return this.tmdb.obtenirPlusieursFilms(data.ids);
  }

  @MessagePattern('tmdb.films.populaires')
  obtenirPopulaires() {
    return this.tmdb.obtenirFilmsPopulaires();
  }

  @MessagePattern('tmdb.recherche')
  rechercher(@Payload() data: { query: string }) {
    return this.tmdb.rechercherFilms(data.query);
  }

  @MessagePattern('tmdb.recherche.avancee')
  rechercherAvancee(
    @Payload() data: { titre?: string; annee?: string; genre?: string },
  ) {
    return this.tmdb.rechercherFilmsAvancee(data);
  }

  @MessagePattern('tmdb.obtenir.plusieurs.films')
  obtenirPlusieurs(@Payload() data: { ids: number[] }) {
    return this.tmdb.obtenirPlusieursFilms(data.ids);
  }
}
