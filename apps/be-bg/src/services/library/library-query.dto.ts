import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trimIfString = ({ value }: { value: unknown }): unknown => {
  return typeof value === 'string' ? value.trim() : value;
};

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
  @Transform(trimIfString)
  @IsString()
  @MinLength(3, {
    message: 'La recherche doit contenir au moins 3 caractères',
  })
  query?: string;

  // recherche-avancee
  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MinLength(2, {
    message: 'Le titre doit contenir au moins 2 caractères',
  })
  titre?: string;

  @IsOptional()
  @Transform(trimIfString)
  @Matches(/^\d{4}$/, {
    message: "L'année doit être au format YYYY (ex: 2019)",
  })
  annee?: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  genre?: string;
}
