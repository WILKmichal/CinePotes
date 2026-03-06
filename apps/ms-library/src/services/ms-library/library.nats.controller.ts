import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, NatsContext } from '@nestjs/microservices';
import { LibraryService } from './library.service';
import { DetailsFilm } from '../../../../types/library.types';
import type {
  LibraryAdvancedSearchPayload,
  LibraryDetailsPayload,
  LibraryMoviesPayload,
  LibrarySearchPayload,
} from '@workspace/dtos/library';
import { logNatsMessage, logAction, logSuccess, logError, extractRequestId } from '@workspace/logger';

@Controller()
export class LibraryNatsController {
  constructor(private readonly tmdb: LibraryService) {}

  @MessagePattern('library.details')
  async obtenirDetails(@Payload() data: LibraryDetailsPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-library', 'library.details', 'receive', requestId);
    
    try {
      logAction('ms-library', `Fetching movie details for ID: ${data.id}`, requestId);
      const result = await this.tmdb.obtenirDetailsFilm(data.id, requestId);
      logSuccess('ms-library', `Movie details fetched for ID: ${data.id}`, requestId);
      return result;
    } catch (error) {
      logError('ms-library', `Error fetching details for ID: ${data.id}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('library.movies')
  async obtenirMovies(@Payload() data: LibraryMoviesPayload, @Ctx() context: NatsContext): Promise<DetailsFilm[]> {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-library', 'library.movies', 'receive', requestId);
    
    try {
      logAction('ms-library', `Fetching multiple movies, count: ${data.ids.length}`, requestId);
      const result = await this.tmdb.obtenirPlusieursFilms(data.ids, requestId);
      logSuccess('ms-library', `Fetched ${result.length} movies`, requestId);
      return result;
    } catch (error) {
      logError('ms-library', 'Error fetching multiple movies', requestId, error);
      throw error;
    }
  }

  @MessagePattern('library.films.populaires')
  async obtenirPopulaires(@Ctx() context: NatsContext) {
    const requestId = extractRequestId(context);
    logNatsMessage('ms-library', 'library.films.populaires', 'receive', requestId);
    
    try {
      logAction('ms-library', 'Fetching popular movies', requestId);
      const result = await this.tmdb.obtenirFilmsPopulaires(requestId);
      logSuccess('ms-library', `Fetched ${result.length} popular movies`, requestId);
      return result;
    } catch (error) {
      logError('ms-library', 'Error fetching popular movies', requestId, error);
      throw error;
    }
  }

  @MessagePattern('library.recherche')
  async rechercher(@Payload() data: LibrarySearchPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-library', 'library.recherche', 'receive', requestId);
    
    try {
      logAction('ms-library', `Searching movies with query: ${data.query}`, requestId);
      const result = await this.tmdb.rechercherFilms(data.query, requestId);
      logSuccess('ms-library', `Found ${result.length} movies for query: ${data.query}`, requestId);
      return result;
    } catch (error) {
      logError('ms-library', `Error searching movies: ${data.query}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('library.recherche.avancee')
  async rechercherAvancee(@Payload() data: LibraryAdvancedSearchPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-library', 'library.recherche.avancee', 'receive', requestId);
    
    try {
      logAction('ms-library', 'Advanced search request', requestId);
      const result = await this.tmdb.rechercherFilmsAvancee(data, requestId);
      logSuccess('ms-library', `Advanced search returned ${result.length} movies`, requestId);
      return result;
    } catch (error) {
      logError('ms-library', 'Error in advanced search', requestId, error);
      throw error;
    }
  }

  @MessagePattern('library.obtenir.plusieurs.films')
  async obtenirPlusieurs(@Payload() data: LibraryMoviesPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-library', 'library.obtenir.plusieurs.films', 'receive', requestId);
    
    try {
      logAction('ms-library', `Fetching multiple films, count: ${data.ids.length}`, requestId);
      const result = await this.tmdb.obtenirPlusieursFilms(data.ids, requestId);
      logSuccess('ms-library', `Fetched ${result.length} films`, requestId);
      return result;
    } catch (error) {
      logError('ms-library', 'Error fetching multiple films', requestId, error);
      throw error;
    }
  }
}
