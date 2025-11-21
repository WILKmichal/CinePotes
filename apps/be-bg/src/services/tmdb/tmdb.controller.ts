import { Controller } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { Param } from '@nestjs/common';
import { ParseIntPipe } from '@nestjs/common';
import { DetailsFilm } from './types/tmdb.types';
import { TmdbService } from './tmdb.service';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  /**
  * Methode pour obtenir les détails d'un film par son identifiant TMDB.
  * @param id - Identifiant TMDB du film
  * @returns Détails du film
  */
  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number): Promise<DetailsFilm> {
    // return new Promise<DetailsFilm>((resolve) => resolve ({
    //   id: 550,
    //   titre: "Fight Club",
    //   resume: "A ticking-time-bomb insomniac and a slippery soap salesman channel perfect murder into a shocking new reality.",
    //   date_sortie: "1999-10-12",
    //   affiche_url: null,
    //   note_moyenne: 8.7
    // }));
    return this.tmdbService.obtenirDetailsFilm(id);
  }
}
