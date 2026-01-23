import {IsString, Length} from 'class-validator';

export class JoinSeanceDto {
    @IsString()
    @Length(6, 6)
    code: string // Code unique de la séance à rejoindre (6 caractères)

    // utilisateur_id → sera récupéré depuis le JWT
    // seance_id → sera trouvé via le code dans le service
    // a_rejoint_le → géré par la BDD (DEFAULT NOW())
}

