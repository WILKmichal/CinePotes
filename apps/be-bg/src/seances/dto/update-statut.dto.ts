import { IsEnum } from 'class-validator';
import { SeanceStatut } from '../entities/seance.entity';

export class UpdateStatutDto {
  @IsEnum(SeanceStatut)
  statut: SeanceStatut;
}
