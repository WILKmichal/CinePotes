import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LibraryService } from './library.service';
import { DetailsFilm } from '../../../../types/library.types';

@Controller()
export class LibraryNatsController {
  constructor(private readonly tmdb: LibraryService) {}

  @MessagePattern('library.details')
  obtenirDetails(@Payload() data: { id: number }) {
    return this.tmdb.obtenirDetailsFilm(data.id);
  }

  @MessagePattern('library.movies')
  obtenirMovies(@Payload() data: { ids: number[] }): Promise<DetailsFilm[]> {
    return this.tmdb.obtenirPlusieursFilms(data.ids);
  }

  @MessagePattern('library.films.populaires')
  obtenirPopulaires() {
    return this.tmdb.obtenirFilmsPopulaires();
  }

  @MessagePattern('library.recherche')
  rechercher(@Payload() data: { query: string }) {
    return this.tmdb.rechercherFilms(data.query);
  }

  @MessagePattern('library.recherche.avancee')
  rechercherAvancee(
    @Payload() data: { titre?: string; annee?: string; genre?: string },
  ) {
    return this.tmdb.rechercherFilmsAvancee(data);
  }

  @MessagePattern('library.obtenir.plusieurs.films')
  obtenirPlusieurs(@Payload() data: { ids: number[] }) {
    return this.tmdb.obtenirPlusieursFilms(data.ids);
  }
}
