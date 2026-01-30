import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ListesService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { AddFilmDto } from './dto/add-film.dto';
import {
  ListResponseDto,
  ListWithFilmsResponseDto,
  FilmsInListResponseDto,
  AddFilmResponseDto,
} from './dto/list-response.dto';

@ApiTags('Lists')
@ApiBearerAuth()
@Controller('lists')
@UseGuards(AuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListesService) {}

  @Get()
  @ApiOperation({ summary: "Récupérer toutes les listes de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Liste des listes personnelles',
    type: [ListResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async findAll(@Request() req: { user: { sub: string } }) {
    const userId = req.user.sub;
    return this.listsService.findAllByUser(userId);
  }

  @Get('with-films')
  @ApiOperation({ summary: 'Récupérer toutes les listes avec leurs films' })
  @ApiResponse({
    status: 200,
    description: 'Liste des listes avec les IDs TMDB des films',
    type: [ListWithFilmsResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async findAllWithFilms(@Request() req: { user: { sub: string } }) {
    const userId = req.user.sub;
    return this.listsService.findAllByUserWithFilms(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une liste spécifique' })
  @ApiParam({ name: 'id', description: 'ID de la liste (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la liste',
    type: ListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Liste non trouvée' })
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    const liste = await this.listsService.findOne(id, userId);
    if (!liste) {
      throw new NotFoundException('Liste non trouvée');
    }
    return liste;
  }

  @Get(':id/films')
  @ApiOperation({ summary: "Récupérer les films d'une liste" })
  @ApiParam({ name: 'id', description: 'ID de la liste (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des IDs TMDB des films',
    type: FilmsInListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Liste non trouvée' })
  async getFilms(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    const liste = await this.listsService.findOne(id, userId);
    if (!liste) {
      throw new NotFoundException('Liste non trouvée');
    }
    const films = await this.listsService.getFilmsInList(id, userId);
    return { listeId: id, films };
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle liste' })
  @ApiResponse({
    status: 201,
    description: 'Liste créée avec succès',
    type: ListResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async create(
    @Body() createListDto: CreateListDto,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;

    if (!createListDto.nom || createListDto.nom.trim() === '') {
      throw new BadRequestException('Le nom de la liste est requis');
    }

    return this.listsService.create(
      userId,
      createListDto.nom.trim(),
      createListDto.description?.trim(),
    );
  }

  @Post(':id/films')
  @ApiOperation({ summary: 'Ajouter un film à une liste' })
  @ApiParam({ name: 'id', description: 'ID de la liste (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Film ajouté avec succès',
    type: AddFilmResponseDto,
  })
  @ApiResponse({ status: 400, description: 'tmdbId manquant' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé à cette liste' })
  async addFilm(
    @Param('id') id: string,
    @Body() addFilmDto: AddFilmDto,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;

    if (!addFilmDto.tmdbId) {
      throw new BadRequestException('tmdbId est requis');
    }

    const result = await this.listsService.addFilmToList(
      id,
      addFilmDto.tmdbId,
      userId,
    );

    if (!result) {
      throw new ForbiddenException('Liste non trouvée ou accès refusé');
    }

    return { message: 'Film ajouté à la liste', ...result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une liste' })
  @ApiParam({ name: 'id', description: 'ID de la liste (UUID)' })
  @ApiResponse({ status: 204, description: 'Liste supprimée avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Liste non trouvée' })
  async delete(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    const deleted = await this.listsService.delete(id, userId);
    if (!deleted) {
      throw new NotFoundException('Liste non trouvée');
    }
  }

  @Delete(':id/films/:tmdbId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Retirer un film d'une liste" })
  @ApiParam({ name: 'id', description: 'ID de la liste (UUID)' })
  @ApiParam({ name: 'tmdbId', description: 'ID TMDB du film' })
  @ApiResponse({ status: 204, description: 'Film retiré avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Film ou liste non trouvé' })
  async removeFilm(
    @Param('id') id: string,
    @Param('tmdbId') tmdbId: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    const removed = await this.listsService.removeFilmFromList(
      id,
      Number.parseInt(tmdbId, 10),
      userId,
    );
    if (!removed) {
      throw new NotFoundException('Film ou liste non trouvé');
    }
  }
}