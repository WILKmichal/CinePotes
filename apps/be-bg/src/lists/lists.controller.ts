/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Inject,
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
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import {
  AddFilmDto,
  AddFilmResponseDto,
  CreateListDto,
  FilmsInListResponseDto,
  ListResponseDto,
  ListWithFilmsResponseDto,
} from '@workspace/dtos/lists';
import {
  AddFilmToListPayload,
  CreateListPayload,
  DeleteListPayload,
  FindAllByUserPayload,
  FindAllByUserWithFilmsPayload,
  FindOnePayload,
  GetFilmsInListPayload,
  RemoveFilmFromListPayload,
  UpdateListPayload,
} from '@workspace/dtos/lists';
import { NatsClientWrapper } from '../nats/nats-client-wrapper.service';

@ApiTags('Lists')
@ApiBearerAuth()
@Controller('lists')
@UseGuards(AuthGuard)
export class ListsController {
  constructor(private readonly nats: NatsClientWrapper) {}

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
    const payload: FindAllByUserPayload = { userId };
    return firstValueFrom(this.nats.send('list.findAllByUser', payload));
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
    const payload: FindAllByUserWithFilmsPayload = { userId };
    return firstValueFrom(
      this.nats.send('list.findAllByUserWithFilms', payload),
    );
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
    const payload: FindOnePayload = { listeId: id, userId };
    const liste = await firstValueFrom(
      this.nats.send('list.findOne', payload),
    );
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
    const findOnePayload: FindOnePayload = { listeId: id, userId };
    const liste = await firstValueFrom(this.nats.send('list.findOne', findOnePayload));
    if (!liste) {
      throw new NotFoundException('Liste non trouvée');
    }
    const filmsPayload: GetFilmsInListPayload = { listeId: id, userId };
    const films = await firstValueFrom(this.nats.send('list.getFilmsInList', filmsPayload));
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

    const payload: CreateListPayload = {
      userId,
      nom: createListDto.nom.trim(),
      description: createListDto.description?.trim(),
    };

    return firstValueFrom(
      this.nats.send('list.create', payload),
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

    const payload: AddFilmToListPayload = {
      listeId: id,
      tmdbId: addFilmDto.tmdbId,
      userId,
    };

    const result = await firstValueFrom(
      this.nats.send('list.addFilmToList', payload),
    );

    if (!result) {
      throw new ForbiddenException('Liste non trouvée ou accès refusé');
    }

    return { message: 'Film ajouté à la liste', ...result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une liste (nom, description)' })
  @ApiParam({ name: 'id', description: 'ID de la liste (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Liste modifiée avec succès',
    type: ListResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Liste non trouvée' })
  async update(
    @Param('id') id: string,
    @Body() updateListDto: CreateListDto,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;

    if (!updateListDto.nom || updateListDto.nom.trim() === '') {
      throw new BadRequestException('Le nom de la liste est requis');
    }

    const payload: UpdateListPayload = {
      listeId: id,
      userId,
      nom: updateListDto.nom.trim(),
      description: updateListDto.description?.trim(),
    };

    const updated = await firstValueFrom(
      this.nats.send('list.update', payload),
    );

    if (!updated) {
      throw new NotFoundException('Liste non trouvée');
    }

    return updated;
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
    const payload: DeleteListPayload = { listeId: id, userId };
    const deleted = await firstValueFrom(
      this.nats.send('list.delete', payload),
    );
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
    const payload: RemoveFilmFromListPayload = {
      listeId: id,
      tmdbId: Number.parseInt(tmdbId, 10),
      userId,
    };
    const removed = await firstValueFrom(
      this.nats.send('list.removeFilmFromList', payload),
    );
    if (!removed) {
      throw new NotFoundException('Film ou liste non trouvé');
    }
  }
}
