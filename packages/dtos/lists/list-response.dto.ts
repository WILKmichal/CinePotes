import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListResponseDto {
  @ApiProperty({
    description: 'ID unique de la liste',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nom de la liste',
    example: 'Films à voir',
  })
  nom: string;

  @ApiPropertyOptional({
    description: 'Description de la liste',
    example: 'Ma liste de films à regarder ce weekend',
  })
  description?: string;

  @ApiProperty({
    description: "ID de l'utilisateur propriétaire",
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  utilisateur_id: string;

  @ApiProperty({
    description: 'Date de création',
    example: '2024-01-22T10:30:00.000Z',
  })
  cree_le: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2024-01-22T10:30:00.000Z',
  })
  maj_le: Date;
}

export class ListWithFilmsResponseDto extends ListResponseDto {
  @ApiProperty({
    description: 'Liste des IDs TMDB des films',
    example: [550, 551, 552],
    type: [Number],
  })
  films: number[];
}

export class FilmsInListResponseDto {
  @ApiProperty({
    description: 'ID de la liste',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  listeId: string;

  @ApiProperty({
    description: 'Liste des IDs TMDB des films',
    example: [550, 551, 552],
    type: [Number],
  })
  films: number[];
}

export class AddFilmResponseDto {
  @ApiProperty({
    description: 'Message de confirmation',
    example: 'Film ajouté à la liste',
  })
  message: string;

  @ApiProperty({
    description: 'ID de la liste',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  liste_id: string;

  @ApiProperty({
    description: 'ID TMDB du film',
    example: 550,
  })
  tmdb_id: number;

  @ApiProperty({
    description: "Date d'ajout",
    example: '2024-01-22T10:30:00.000Z',
  })
  cree_le: Date;
}
