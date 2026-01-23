import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateListDto {
  @ApiProperty({
    description: 'Nom de la liste',
    example: 'Films à voir',
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom de la liste est obligatoire' })
  nom: string;

  @ApiPropertyOptional({
    description: 'Description de la liste',
    example: 'Ma liste de films à regarder ce weekend',
  })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @IsOptional()
  description?: string;
}
