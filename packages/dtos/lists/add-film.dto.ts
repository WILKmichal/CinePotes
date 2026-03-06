import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddFilmDto {
  @ApiProperty({
    description: 'ID du film sur TMDB',
    example: 550,
  })
  @IsNumber({}, { message: 'tmdbId doit être un nombre' })
  @IsNotEmpty({ message: 'tmdbId est obligatoire' })
  tmdbId: number;
}
