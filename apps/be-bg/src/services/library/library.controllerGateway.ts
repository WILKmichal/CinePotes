import {
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { DetailsFilm, TMDB_PATTERNS } from '@repo/types/library';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TmdbQueryDto } from './library-query.dto';

/* Gateway HTTP "library":
* expose des routes REST, puis délègue le vrai traitement
* au microservice library via NATS
*/
@Controller('library')
export class LibraryController {
  // Client NATS injecté pour communiquer avec les microservices
  constructor(@Inject('NATS_SERVICE') private readonly nats: ClientProxy) {}

  // GET /library/movies?ids=1,2,3
  // Convertit la liste d'IDs en tableau de nombres puis interroge le pattern MOVIES.
  @ApiOperation({ summary: 'Récupérer plusieurs films par leurs IDs TMDB' })
  @Get('movies')
  async getPlusieursFilms(@Query() dto: TmdbQueryDto): Promise<DetailsFilm[]> {
    // dto.ids est une chaîne "1,2,3" -> number[] [1,2,3]
    const filmIds = dto
      .ids!.split(',')
      .map((x) => Number.parseInt(x.trim(), 10));

    // Envoi RPC NATS vers le microservice library, puis conversion Observable -> Promise.
    return await firstValueFrom(
      this.nats.send<DetailsFilm[]>(TMDB_PATTERNS.MOVIES, { ids: filmIds }),
    );
  }

  // GET /library/films/populaires
  // Récupère les films populaires depuis le microservice TMDB.
  @ApiOperation({ summary: 'Récupérer les films populaires' })
  @Get('films/populaires')
  async getPopularMovies(): Promise<DetailsFilm[]> {
    // Pas de payload spécifique pour cet endpoint.
    return await firstValueFrom(
      this.nats.send<DetailsFilm[]>(TMDB_PATTERNS.POPULAIRES, {}),
    );
  }

  // GET /library/recherche?query=...
  // Recherche textuelle simple par mot-clé.
  @ApiOperation({ summary: 'Rechercher des films par texte' })
  @Get('recherche')
  async rechercherFilms(@Query() dto: TmdbQueryDto): Promise<DetailsFilm[]> {
    // Forward direct de la query texte vers le pattern RECHERCHE.
    return await firstValueFrom(
      this.nats.send<DetailsFilm[]>(TMDB_PATTERNS.RECHERCHE, {
        query: dto.query,
      }),
    );
  }

  // GET /library/recherche/avancee?titre=...&annee=...&genre=...
  // Recherche multi-critères (tous les paramètres sont optionnels).
  @ApiOperation({ summary: 'Recherche avancée de films' })
  @Get('recherche/avancee')
  async rechercherFilmsAvancee(
    @Query() dto: TmdbQueryDto,
  ): Promise<DetailsFilm[]> {
    // Forward des filtres optionnels (titre/annee/genre) au microservice.
    return await firstValueFrom(
      this.nats.send<DetailsFilm[]>(TMDB_PATTERNS.RECHERCHE_AVANCEE, {
        titre: dto.titre,
        annee: dto.annee,
        genre: dto.genre,
      }),
    );
  }

  // GET /library/:id
  // Parse et valide l'ID (entier), puis récupère les détails d'un film unique.
  @ApiOperation({ summary: 'Récupérer le détail d’un film par ID TMDB' })
  @ApiParam({
    name: 'id',
    description: 'ID TMDB du film',
    example: 603,
  })
  @Get(':id')
  async getMovie(@Param('id', ParseIntPipe) id: number): Promise<DetailsFilm> {
    // ParseIntPipe valide et convertit l'id de l'URL en number.
    return await firstValueFrom(
      this.nats.send<DetailsFilm>(TMDB_PATTERNS.DETAILS, { id }),
    );
  }
}
