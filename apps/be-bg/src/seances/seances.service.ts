import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pool } from 'pg';
import { randomBytes } from 'crypto';
import { PG_POOL } from '../../database/database.module';
import { CreateSeanceDto } from './dto/create-seance.dto';
import { Seance } from './entities/seance.entity';
import { Participant } from './entities/participant.entity';

@Injectable()
export class SeancesService {
  // Injection du pool de connexion utilisant le token PG_POOL
  // constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  constructor(
    @InjectRepository(Seance)
    private seancesRepository: Repository<Seance>,
    @InjectRepository(Participant)
    private participantsRepository: Repository<Participant>,
  ) {}

  //Genère un code unique de 6 caractères pour la séance
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(bytes[i] % chars.length);
    }
    return code;
  }

  findAll(): Promise<Seance[]> {
    return this.seancesRepository.find();
  }



  // Crée une nouvelle séance
  async create(createSeanceDto: CreateSeanceDto, proprietaire_id: string) {

    // Vérifier si le propriétaire a déjà une séance active
    const existingSeance = await this.findByProprietaire(proprietaire_id);
    if (existingSeance) {
      throw new ConflictException('Vous avez déjà une séance active. Veuillez la terminer avant d\'en créer une nouvelle.');
    }
    const code = this.generateCode();
    //pourquoi utiliser des placeholders ? pour éviter les injections SQL, on retrouve le lien avec les placeholders ensuite dans le tab
    /* exemple :
    const res = await this.pool.query(query, [
        createSeanceDto.nom,  --> $1
        createSeanceDto.date, --> $2
        createSeanceDto.max_films, --> $3
        proprietaire_id, --> $4
        'en_attente', -->  $5
        code,  --> $6
        true,  --> $7
      ]
    */
    const queries = [
    `
      INSERT INTO seance (nom, date, max_films, proprietaire_id, statut, code, est_actif)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nom, date, max_films, proprietaire_id, statut, code, est_actif, cree_le, maj_le
    `,
    ];
    for (const query of queries) {
    try {
      const res = await this.pool.query(query, [
        createSeanceDto.nom,
        createSeanceDto.date,
        createSeanceDto.max_films,
        proprietaire_id,        // Vient du JWT
        'en_attente',          // Statut par défaut
        code,                  // Code généré
        true,                  // est_actif = true
      ]);

      if (res.rowCount && res.rowCount > 0) {
        return res.rows[0]; // Retourne la séance créée
        }
      } catch (error) {
        // Si collision de code (erreur 23505), on pourrait regénérer
        console.error('Query failed, trying fallback', error);
      }
    }
    throw new Error('Impossible de créer la séance');
  }


async join(code: string, utilisateur_id: string): Promise<{ participant: Participant; seance: Seance }>  {
  const seance = await this.findByCode(code);

  if (seance.statut !== 'en_attente') {
    throw new ConflictException('La séance n\'accepte plus de participants');
  }
  const query = `
    INSERT INTO participant (seance_id, utilisateur_id)
    VALUES ($1, $2)
    RETURNING id, seance_id, utilisateur_id, a_rejoint_le
  `;

  try {
    const res = await this.pool.query(query, [seance.id, utilisateur_id]);
    if (res.rowCount && res.rowCount > 0) {
      return {
        participant: res.rows[0],
        seance: seance,
      };
    }
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictException('Vous avez déjà rejoint cette séance');
    }
    throw error; // Relancer l'erreur si ce n'est pas une contrainte unique
  }

  throw new Error('Impossible de rejoindre la séance');
}
  //Récupère la séance créée par l'utilisateur connecté
    async findByProprietaire(proprietaire_id: string){
    const queries = [
      `
      SELECT id, nom, date, max_films, proprietaire_id, statut, code, est_actif, cree_le, maj_le
      FROM seance
      WHERE proprietaire_id = $1 AND est_actif = true
      ORDER BY date DESC
      LIMIT 1
      `,
    ];

    for (const query of queries) {
      try{
        const res = await this.pool.query(query, [proprietaire_id]);
        if (res.rowCount && res.rowCount > 0) {
          return res.rows[0] as Seance;
        }
      } catch (error){
        console.error('Query failed, try fallback', error);
      }
    }

    return null; //Retourne rien
  }


  //Find une seance avec son code, utilise pour rejoindre une via code
  async findByCode(code : string) {
  const queries = [
    `
      SELECT id, nom, date, max_films, proprietaire_id, statut, code, est_actif, cree_le, maj_le
      FROM seance
      WHERE code = $1 AND est_actif = true
      LIMIT 1
    `,
  ];

   for (const query of queries) {
        try {
          const res = await this.pool.query(query, [code]);
          if (res.rowCount && res.rowCount > 0) {
            return res.rows[0] as Seance;
          }
        } catch (error) {
          // Log uniquement, on tente le fallback
          console.error('Query failed, trying fallback', error);
        }
      }
      throw new NotFoundException(`Seance avec le code ${code} introuvable`);
  }

  async getParticipants(seance_id: string) {
    const queries = [
      `
      SELECT
        p.id,
        p.seance_id,
        p.utilisateur_id,
        p.a_rejoint_le,
        u.nom,
        u.email
      FROM participant p
      JOIN utilisateur u ON p.utilisateur_id = u.id
      WHERE p.seance_id = $1
      ORDER BY p.a_rejoint_le ASC
      `,
    ];

    for (const query of queries){
      try{
        const res= await this.pool.query(query, [seance_id]);
        return res.rows; //Retourne le tableau de participants
      }catch(error){
        console.error('Find seance avec son code', error);
      }
    }

    return []; //Si tout échoue, retourne tab vide
  }
  //Quitter une séance ( suppression d'un participant )
  async leave(seance_id: string, utilisateur_id: string) {
    const query = `
      DELETE FROM participant
      WHERE seance_id = $1 AND utilisateur_id = $2
    `;

    const res = await this.pool.query(query, [seance_id, utilisateur_id]);

    if (res.rowCount === 0) {
      throw new NotFoundException('Vous n\'etes pas participant de cette séance');
    }

    return { message: 'Vous avez quitté la séance' };
  }
  //Lancer le vote (changement de statut de la séance) Seule le proprietaire peut le faire
  async updateStatut(seance_id: string, proprietaire_id: string, nouveauStatut: string) {
    const query = `
      UPDATE seance
      SET statut = $1, maj_le = NOW()
      WHERE id = $2 AND proprietaire_id = $3
      RETURNING *
    `;

    const res = await this.pool.query(query, [nouveauStatut, seance_id, proprietaire_id]);

    if (res.rowCount === 0) {
      throw new NotFoundException('Séance introuvable ou non autorisé');
    }

    return res.rows[0];
  }

}
