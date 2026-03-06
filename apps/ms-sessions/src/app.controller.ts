import { Controller } from '@nestjs/common';
import { SeancesService } from './seances/seances.service';
import { MessagePattern, Payload, Ctx, NatsContext } from '@nestjs/microservices';
import type {
  AllClassementsSubmittedPayload,
  AllParticipantsSubmittedPayload,
  CheckCodePayload,
  CheckParticipantPayload,
  CreateSeancePayload,
  DeleteSeancePayload,
  FindMySeancePayload,
  GetAllSessionsPayload,
  GetParticipantsPayload,
  GetPropositionsPayload,
  GetResultatFinalPayload,
  JoinSeancePayload,
  LeaveSeancePayload,
  SubmitClassementPayload,
  SubmitPropositionsPayload,
  UpdateStatutPayload,
} from '@workspace/dtos/seances';
import { logNatsMessage, logAction, logSuccess, logError, extractRequestId } from '@workspace/logger';

@Controller()
export class AppController {
  constructor(private readonly seancesService: SeancesService) {}

  @MessagePattern('seances.create')
  async create(@Payload() data: CreateSeancePayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.create', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `Creating session for user: ${data.userId}`, requestId);
      const result = await this.seancesService.create(data.dto, data.userId);
      logSuccess('ms-sessions', `Created session: ${result.id} for user: ${data.userId}`, requestId);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logError('ms-sessions', `Error creating session for user: ${data.userId} - ${errorMsg}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.join')
  async join(@Payload() data: JoinSeancePayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.join', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `User ${data.userId} joining session with code: ${data.code}`, requestId);
      const result = await this.seancesService.join(data.code, data.userId);
      logSuccess('ms-sessions', `User ${data.userId} joined session: ${result.seance.id}`, requestId);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logError('ms-sessions', `Error joining session for user: ${data.userId} - ${errorMsg}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.participants')
  async getParticipants(@Payload() data: GetParticipantsPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.participants', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `Getting participants for session: ${data.seanceId}`, requestId);
      const result = await this.seancesService.getParticipants(data.seanceId);
      logSuccess('ms-sessions', `Retrieved ${result.length} participants`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error getting participants for session: ${data.seanceId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.updateStatut')
  async updateStatut(@Payload() data: UpdateStatutPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.updateStatut', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `Updating status for session: ${data.seanceId} to ${data.statut}`, requestId);
      const result = await this.seancesService.updateStatut(
        data.seanceId,
        data.userId,
        data.statut,
      );
      logSuccess('ms-sessions', `Updated status for session: ${data.seanceId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error updating status for session: ${data.seanceId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.self')
  async findMySeance(@Payload() data: FindMySeancePayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.self', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `Finding active session for user: ${data.userId}`, requestId);
      const result = await this.seancesService.findActiveSeanceForUser(data.userId);
      logSuccess('ms-sessions', `Found active session for user: ${data.userId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error finding active session for user: ${data.userId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.checkCode')
  async checkCode(@Payload() data: CheckCodePayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.checkCode', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `Checking if session code exists: ${data.code}`, requestId);
      const result = await this.seancesService.checkCodeExists(data.code);
      logSuccess('ms-sessions', `Session code ${data.code} is valid`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error checking session code: ${data.code}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.checkParticipant')
  async checkParticipant(@Payload() data: CheckParticipantPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.checkParticipant', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `Checking participant access for user: ${data.userId} in session: ${data.seanceId}`, requestId);
      const result = await this.seancesService.checkParticipant(data.seanceId, data.userId);
      logSuccess('ms-sessions', `Participant check completed - isAuthorized: ${result.isAuthorized}`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error checking participant for session: ${data.seanceId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.leave')
  async leave(@Payload() data: LeaveSeancePayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.leave', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `User ${data.userId} leaving session: ${data.seanceId}`, requestId);
      const result = await this.seancesService.leave(data.seanceId, data.userId);
      logSuccess('ms-sessions', `User ${data.userId} left session: ${data.seanceId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error leaving session: ${data.seanceId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.delete')
  async deleteSeance(@Payload() data: DeleteSeancePayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.delete', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `Deleting session: ${data.seanceId}`, requestId);
      const result = await this.seancesService.deleteSeance(data.seanceId, data.userId);
      logSuccess('ms-sessions', `Deleted session: ${data.seanceId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error deleting session: ${data.seanceId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.propositions.submit')
  async submitPropositions(@Payload() data: SubmitPropositionsPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.propositions.submit', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `User ${data.userId} submitting ${data.tmdbIds.length} propositions`, requestId);
      const result = await this.seancesService.submitPropositions(
        data.seanceId,
        data.userId,
        data.tmdbIds,
      );
      logSuccess('ms-sessions', `User ${data.userId} submitted propositions`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error submitting propositions for session: ${data.seanceId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.propositions.get')
  async getPropositions(@Payload() data: GetPropositionsPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.propositions.get', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `Getting propositions for session: ${data.seanceId}`, requestId);
      const result = await this.seancesService.getPropositions(data.seanceId);
      logSuccess('ms-sessions', `Retrieved propositions for session: ${data.seanceId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error getting propositions for session: ${data.seanceId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.propositions.allSubmitted')
  async allParticipantsSubmitted(@Payload() data: AllParticipantsSubmittedPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.propositions.allSubmitted', 'receive', requestId);
    
    try {
      const result = await this.seancesService.allParticipantsSubmitted(data.seanceId);
      logSuccess('ms-sessions', `Checked all participants submitted for session: ${data.seanceId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error checking all submitted for session: ${data.seanceId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.classement.submit')
  async submitClassement(@Payload() data: SubmitClassementPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.classement.submit', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `User ${data.userId} submitting ranking`, requestId);
      const result = await this.seancesService.submitClassement(
        data.seanceId,
        data.userId,
        data.classement,
      );
      logSuccess('ms-sessions', `User ${data.userId} submitted ranking`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error submitting ranking for session: ${data.seanceId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.classement.allSubmitted')
  async allClassementsSubmitted(@Payload() data: AllClassementsSubmittedPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.classement.allSubmitted', 'receive', requestId);
    
    try {
      const result = await this.seancesService.allClassementsSubmitted(data.seanceId);
      logSuccess('ms-sessions', `Checked all rankings submitted for session: ${data.seanceId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error checking all rankings submitted for session: ${data.seanceId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.classement.resultat')
  async getResultatFinal(@Payload() data: GetResultatFinalPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.classement.resultat', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `Getting final result for session: ${data.seanceId}`, requestId);
      const result = await this.seancesService.getResultatFinal(data.seanceId);
      logSuccess('ms-sessions', `Retrieved final result for session: ${data.seanceId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error getting final result for session: ${data.seanceId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern('seances.self.all')
  async findAllSessions(@Payload() data: GetAllSessionsPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-sessions', 'seances.self.all', 'receive', requestId);
    
    try {
      logAction('ms-sessions', `Finding all sessions for user: ${data.userId}`, requestId);
      const result = await this.seancesService.findAllSessionsForUser(data.userId);
      logSuccess('ms-sessions', `Found ${result.participated.length} participated sessions for user: ${data.userId}`, requestId);
      return result;
    } catch (error) {
      logError('ms-sessions', `Error finding all sessions for user: ${data.userId}`, requestId, error);
      throw error;
    }
  }
}
