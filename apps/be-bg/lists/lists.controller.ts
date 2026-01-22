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
import { AuthGuard } from '../auth/auth.guard';
import { ListsService } from './lists.service';

interface CreateListDto {
  nom: string;
  description?: string;
}

interface AddFilmDto {
  tmdbId: number;
}

@Controller('lists')
@UseGuards(AuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  /**
   * GET /lists - Récupère toutes les listes de l'utilisateur connecté
   */
  @Get()
  async findAll(@Request() req: { user: { sub: string } }) {
    const userId = req.user.sub;
    return this.listsService.findAllByUser(userId);
  }

  /**
   * GET /lists/with-films - Récupère toutes les listes avec leurs films
   */
  @Get('with-films')
  async findAllWithFilms(@Request() req: { user: { sub: string } }) {
    const userId = req.user.sub;
    return this.listsService.findAllByUserWithFilms(userId);
  }

  /**
   * GET /lists/:id - Récupère une liste spécifique
   */
  @Get(':id')
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

  /**
   * GET /lists/:id/films - Récupère les films d'une liste
   */
  @Get(':id/films')
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

  /**
   * POST /lists - Crée une nouvelle liste
   */
  @Post()
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

  /**
   * POST /lists/:id/films - Ajoute un film à une liste
   */
  @Post(':id/films')
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

  /**
   * DELETE /lists/:id - Supprime une liste
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
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

  /**
   * DELETE /lists/:id/films/:tmdbId - Retire un film d'une liste
   */
  @Delete(':id/films/:tmdbId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFilm(
    @Param('id') id: string,
    @Param('tmdbId') tmdbId: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    const removed = await this.listsService.removeFilmFromList(
      id,
      parseInt(tmdbId, 10),
      userId,
    );
    if (!removed) {
      throw new NotFoundException('Film ou liste non trouvé');
    }
  }
}
