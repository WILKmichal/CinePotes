import { SeanceStatut } from 'schemas/seance.entity';
import { CreateSeanceDto } from './create-seance.dto';

export interface CreateSeancePayload {
  dto: CreateSeanceDto;
  userId: string;
}

export interface JoinSeancePayload {
  code: string;
  userId: string;
}

export interface GetParticipantsPayload {
  seanceId: string;
}

export interface UpdateStatutPayload {
  seanceId: string;
  userId: string;
  statut: SeanceStatut;
}

export interface FindMySeancePayload {
  userId: string;
}

export interface LeaveSeancePayload {
  seanceId: string;
  userId: string;
}

export interface DeleteSeancePayload {
  seanceId: string;
  userId: string;
}

export interface SubmitPropositionsPayload {
  seanceId: string;
  userId: string;
  tmdbIds: number[];
}

export interface GetPropositionsPayload {
  seanceId: string;
}

export interface AllParticipantsSubmittedPayload {
  seanceId: string;
}

export interface SubmitClassementPayload {
  seanceId: string;
  userId: string;
  classement: { tmdb_id: number; rang: number }[];
}

export interface AllClassementsSubmittedPayload {
  seanceId: string;
}

export interface GetResultatFinalPayload {
  seanceId: string;
}

export interface CheckCodePayload {
  code: string;
}

export interface GetAllSessionsPayload {
  userId: string;
}

export interface CheckParticipantPayload {
  seanceId: string;
  userId: string;
}
