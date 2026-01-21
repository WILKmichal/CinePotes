import { PartialType } from '@nestjs/mapped-types';
import { CreateSeanceDto } from './create-seance.dto';
import { IsString, IsDateString, IsInt, Min,Max, IsOptional, IsEnum } from 'class-validator';

export class UpdateSeanceDto extends PartialType(CreateSeanceDto) {
    @IsOptional()
    @IsString()
    nom?: string // Nom de la séance

    @IsOptional()
    @IsDateString()
    date?: string // Date et heure de la séance au format ISO

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    max_films?: number // Nombre maximum de films dans la séance

    @IsOptional()
    @IsEnum(['en_attente', 'en_cours', 'terminee', 'annulee'])
    statut?: string;  // Pour changer le statut de la séance

}