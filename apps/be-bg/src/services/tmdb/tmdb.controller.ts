// tmdb.controller.ts
import {Controller, Get, HttpException, HttpStatus, Param, ParseIntPipe,Query,} from '@nestjs/common';
import { DetailsFilm } from './types/tmdb.types';
import { TmdbService } from './tmdb.service';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  // Static routes 

  // Récupérer plusieurs films par leurs IDs
  @Get('movies')
  getMovies(@Query('ids') ids: string): Promise<DetailsFilm[]> {
    if (!ids) {
      throw new HttpException('ids est requis', HttpStatus.BAD_REQUEST);
    }

    const filmIds = ids
      .split(',')
      .map((x) => parseInt(x.trim(), 10))
      .filter((n) => Number.isFinite(n));

    if (filmIds.length === 0) {
      throw new HttpException('ids invalide', HttpStatus.BAD_REQUEST);
    }

    return this.tmdbService.obtenirPlusieursFilms(filmIds);
  }

  // Films populaires
  @Get('films/populaires')
  getPopularMovies(): Promise<DetailsFilm[]> {
    return this.tmdbService.obtenirFilmsPopulaires();
  }

  // Recherche
  @Get('recherche')
  rechercherFilms(@Query('query') query: string): Promise<DetailsFilm[]> {
    if (!query || query.trim().length < 3) {
      throw new HttpException(
        'La recherche doit contenir au moins 3 caractères',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.tmdbService.rechercherFilms(query);
  }

  // Dynamic route 
  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number): Promise<DetailsFilm> {
    return this.tmdbService.obtenirDetailsFilm(id);
  }
}
