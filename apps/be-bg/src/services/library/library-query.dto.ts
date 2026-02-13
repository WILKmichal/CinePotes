import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class TmdbQueryDto {
  // ids = "1,2,3"
  @IsOptional()
  @IsString()
  @Matches(/^\s*\d+(\s*,\s*\d+)*\s*$/, {
    message: 'ids doit être une liste d’entiers séparés par des virgules',
  })
  ids?: string;

  // recherche simple
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(3, {
    message: 'La recherche doit contenir au moins 3 caractères',
  })
  query?: string;

  // recherche avancée
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(2, {
    message: 'Le titre doit contenir au moins 2 caractères',
  })
  titre?: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @Matches(/^\d{4}$/, {
    message: "L'année doit être au format YYYY (ex: 2019)",
  })
  annee?: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  genre?: string;
}
