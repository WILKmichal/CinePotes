import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SeanceStatut } from 'schemas/seance.entity';

export class UpdateStatutDto {
  @ApiProperty({
    example: 'en_cours',
    description: 'Nouveau statut de la séance',
    enum: Object.values(SeanceStatut),
  })
  @IsEnum(SeanceStatut)
  statut: SeanceStatut;
}
