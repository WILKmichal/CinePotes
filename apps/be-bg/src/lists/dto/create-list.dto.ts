import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class CreateListDto {
  @ApiProperty({
    description: 'Nom de la liste',
    example: 'Films à voir',
    maxLength: 25,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom de la liste est obligatoire' })
  @MaxLength(25, { message: 'Le nom ne peut pas dépasser 25 caractères' })
  @Matches(/^[\p{L}\p{N} '-]+$/u, {
    message: 'Le nom ne peut contenir que des lettres, chiffres, espaces, apostrophes et tirets',
  })
  nom: string;

  @ApiPropertyOptional({
    description: 'Description de la liste',
    example: 'Ma liste de films à regarder ce weekend',
  })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @IsOptional()
  description?: string;
}
