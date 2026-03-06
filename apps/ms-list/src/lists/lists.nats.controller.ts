import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, NatsContext } from '@nestjs/microservices';
import { ListsService } from './lists.service';
import type {
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
import { logNatsMessage, logAction, logSuccess, logError, extractRequestId } from '@workspace/logger';

@Controller()
export class ListsNatsController {
  constructor(private readonly listsService: ListsService) {}

  @MessagePattern('list.findAllByUser')
  async findAllByUser(@Payload() data: FindAllByUserPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-list', 'list.findAllByUser', 'receive', requestId);
    
    try {
      logAction('ms-list', `Finding all lists for user: ${data.userId}`, requestId);
      const result = await this.listsService.findAllByUser(data.userId);
      logSuccess('ms-list', `Found ${result.length} lists for user: ${data.userId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-list', `Error finding lists for user: ${data.userId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('list.findAllByUserWithFilms')
  async findAllByUserWithFilms(@Payload() data: FindAllByUserWithFilmsPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-list', 'list.findAllByUserWithFilms', 'receive', requestId);
    
    try {
      logAction('ms-list', `Finding all lists with films for user: ${data.userId}`, requestId);
      const result = await this.listsService.findAllByUserWithFilms(data.userId);
      logSuccess('ms-list', `Found ${result.length} lists with films`, requestId);
      return result;
    } catch (error) {
      logError('ms-list', `Error finding lists with films for user: ${data.userId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('list.findOne')
  async findOne(@Payload() data: FindOnePayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-list', 'list.findOne', 'receive', requestId);
    
    try {
      logAction('ms-list', `Finding list: ${data.listeId}`, requestId);
      const result = await this.listsService.findOne(data.listeId, data.userId);
      logSuccess('ms-list', `Found list: ${data.listeId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-list', `Error finding list: ${data.listeId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('list.getFilmsInList')
  async getFilmsInList(@Payload() data: GetFilmsInListPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-list', 'list.getFilmsInList', 'receive', requestId);
    
    try {
      logAction('ms-list', `Getting films in list: ${data.listeId}`, requestId);
      const result = await this.listsService.getFilmsInList(data.listeId, data.userId);
      logSuccess('ms-list', `Retrieved ${result.length} films from list: ${data.listeId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-list', `Error getting films in list: ${data.listeId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('list.create')
  async create(@Payload() data: CreateListPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-list', 'list.create', 'receive', requestId);
    
    try {
      logAction('ms-list', `Creating list "${data.nom}" for user: ${data.userId}`, requestId);
      const result = await this.listsService.create(data.userId, data.nom, data.description);
      logSuccess('ms-list', `Created list: ${result.id}`, requestId);
      return result;
    } catch (error) {
      logError('ms-list', `Error creating list for user: ${data.userId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('list.update')
  async update(@Payload() data: UpdateListPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-list', 'list.update', 'receive', requestId);
    
    try {
      logAction('ms-list', `Updating list: ${data.listeId}`, requestId);
      const result = await this.listsService.update(
        data.listeId,
        data.userId,
        data.nom,
        data.description,
      );
      logSuccess('ms-list', `Updated list: ${data.listeId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-list', `Error updating list: ${data.listeId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('list.delete')
  async delete(@Payload() data: DeleteListPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-list', 'list.delete', 'receive', requestId);
    
    try {
      logAction('ms-list', `Deleting list: ${data.listeId}`, requestId);
      const result = await this.listsService.delete(data.listeId, data.userId);
      logSuccess('ms-list', `Deleted list: ${data.listeId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-list', `Error deleting list: ${data.listeId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('list.addFilmToList')
  async addFilmToList(@Payload() data: AddFilmToListPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-list', 'list.addFilmToList', 'receive', requestId);
    
    try {
      logAction('ms-list', `Adding film ${data.tmdbId} to list: ${data.listeId}`, requestId);
      const result = await this.listsService.addFilmToList(
        data.listeId,
        data.tmdbId,
        data.userId,
      );
      logSuccess('ms-list', `Added film ${data.tmdbId} to list: ${data.listeId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-list', `Error adding film ${data.tmdbId} to list: ${data.listeId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('list.removeFilmFromList')
  async removeFilmFromList(@Payload() data: RemoveFilmFromListPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-list', 'list.removeFilmFromList', 'receive', requestId);
    
    try {
      logAction('ms-list', `Removing film ${data.tmdbId} from list: ${data.listeId}`, requestId);
      const result = await this.listsService.removeFilmFromList(
        data.listeId,
        data.tmdbId,
        data.userId,
      );
      logSuccess('ms-list', `Removed film ${data.tmdbId} from list: ${data.listeId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-list', `Error removing film ${data.tmdbId} from list: ${data.listeId}`, requestId, error);
      throw error;
    }
  }
}
