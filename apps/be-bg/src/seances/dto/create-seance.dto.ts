import { IsString, IsDateString, IsInt, Min, Max, IsDate } from 'class-validator';

export class CreateSeanceDto {
    @IsString()
    nom: string // Nom de la séance

    @IsDate()
    date: Date // Date

    @IsInt()
    @Min(1)
    @Max(5)
    max_films: number // Nombre maximum de films dans la séance

    // proprietaire_id → sera récupéré depuis le JWT (req.user.sub)
    // statut → sera mis à 'en_attente' par défaut dans le service
    // code → sera généré automatiquement dans le service
    // est_actif → sera TRUE par défaut
    // cree_le, maj_le → gérés par la BDD (DEFAULT NOW())
}
