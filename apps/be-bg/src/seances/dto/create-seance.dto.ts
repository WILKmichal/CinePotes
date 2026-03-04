import { IsString, IsInt, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSeanceDto {
  @ApiProperty({ example: 'Soirée Marvel', description: 'Nom de la séance' })
  @IsString()
  nom: string;

  @ApiProperty({
    example: '2026-03-15T20:00:00.000Z',
    description: 'Date de la séance',
  })
  @IsDateString()
  date: Date;

  @ApiProperty({ example: 3, description: 'Nombre maximum de films (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  max_films: number;

  // proprietaire_id → sera récupéré depuis le JWT (req.user.sub)
  // statut → sera mis à 'en_attente' par défaut dans le service
  // code → sera généré automatiquement dans le service
  // est_actif → sera TRUE par défaut
  // cree_le, maj_le → gérés par la BDD (DEFAULT NOW())
}
