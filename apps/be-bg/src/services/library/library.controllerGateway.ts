import {
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { DetailsFilm, TMDB_PATTERNS } from '../../../../types/library.types';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TmdbQueryDto } from './library-query.dto';

@Controller('library')
export class LibraryController {
  constructor(@Inject('NATS_SERVICE') private readonly nats: ClientProxy) {}

  // Récupérer plusieurs films par leurs IDs
  @Get('movies')
  async getPlusieursFilms(@Query() dto: TmdbQueryDto): Promise<DetailsFilm[]> {
    const filmIds = dto
      .ids!.split(',')
      .map((x) => Number.parseInt(x.trim(), 10));

    return await firstValueFrom(
      this.nats.send<DetailsFilm[]>(TMDB_PATTERNS.MOVIES, { ids: filmIds }),
    );
  }

  @Get('films/populaires')
  async getPopularMovies(): Promise<DetailsFilm[]> {
    return await firstValueFrom(
      this.nats.send<DetailsFilm[]>(TMDB_PATTERNS.POPULAIRES, {}),
    );
  }

  @Get('recherche')
  async rechercherFilms(@Query() dto: TmdbQueryDto): Promise<DetailsFilm[]> {
    return await firstValueFrom(
      this.nats.send<DetailsFilm[]>(TMDB_PATTERNS.RECHERCHE, {
        query: dto.query,
      }),
    );
  }

  @Get('recherche/avancee')
  async rechercherFilmsAvancee(
    @Query() dto: TmdbQueryDto,
  ): Promise<DetailsFilm[]> {
    return await firstValueFrom(
      this.nats.send<DetailsFilm[]>(TMDB_PATTERNS.RECHERCHE_AVANCEE, {
        titre: dto.titre,
        annee: dto.annee,
        genre: dto.genre,
      }),
    );
  }

  @Get(':id')
  async getMovie(@Param('id', ParseIntPipe) id: number): Promise<DetailsFilm> {
    return await firstValueFrom(
      this.nats.send<DetailsFilm>(TMDB_PATTERNS.DETAILS, { id }),
    );
  }
}
