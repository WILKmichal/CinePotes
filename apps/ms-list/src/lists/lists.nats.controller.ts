import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ListsService } from './lists.service';

@Controller()
export class ListsNatsController {
  constructor(private readonly listsService: ListsService) {}

  @MessagePattern('list.findAllByUser')
  findAllByUser(@Payload() data: { userId: string }) {
    return this.listsService.findAllByUser(data.userId);
  }

  @MessagePattern('list.findAllByUserWithFilms')
  findAllByUserWithFilms(@Payload() data: { userId: string }) {
    return this.listsService.findAllByUserWithFilms(data.userId);
  }

  @MessagePattern('list.findOne')
  findOne(@Payload() data: { listeId: string; userId: string }) {
    return this.listsService.findOne(data.listeId, data.userId);
  }

  @MessagePattern('list.getFilmsInList')
  getFilmsInList(@Payload() data: { listeId: string; userId: string }) {
    return this.listsService.getFilmsInList(data.listeId, data.userId);
  }

  @MessagePattern('list.create')
  create(
    @Payload() data: { userId: string; nom: string; description?: string },
  ) {
    return this.listsService.create(data.userId, data.nom, data.description);
  }

  @MessagePattern('list.update')
  update(
    @Payload()
    data: {
      listeId: string;
      userId: string;
      nom?: string;
      description?: string;
    },
  ) {
    return this.listsService.update(
      data.listeId,
      data.userId,
      data.nom,
      data.description,
    );
  }

  @MessagePattern('list.delete')
  delete(@Payload() data: { listeId: string; userId: string }) {
    return this.listsService.delete(data.listeId, data.userId);
  }

  @MessagePattern('list.addFilmToList')
  addFilmToList(
    @Payload() data: { listeId: string; tmdbId: number; userId: string },
  ) {
    return this.listsService.addFilmToList(
      data.listeId,
      data.tmdbId,
      data.userId,
    );
  }

  @MessagePattern('list.removeFilmFromList')
  removeFilmFromList(
    @Payload() data: { listeId: string; tmdbId: number; userId: string },
  ) {
    return this.listsService.removeFilmFromList(
      data.listeId,
      data.tmdbId,
      data.userId,
    );
  }
}
