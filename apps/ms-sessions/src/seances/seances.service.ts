import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { Seance, SeanceStatut } from 'schemas/seance.entity';
import { Participant } from 'schemas/participant.entity';

@Injectable()
export class SeancesService {
  constructor(
    @InjectRepository(Seance)
    private readonly seancesRepository: Repository<Seance>,
    @InjectRepository(Participant)
    private readonly participantsRepository: Repository<Participant>,
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
  async create(
    createSeanceDto: { nom: string; date: Date; max_films: number },
    proprietaire_id: string,
  ): Promise<Seance> {
    const existingSeance = await this.findByProprietaire(proprietaire_id);
    if (existingSeance) {
      throw new RpcException({
        statusCode: 409,
        message: 'Vous avez déjà une séance active...',
      });
    }
    const seance = this.seancesRepository.create({
      nom: createSeanceDto.nom,
      date: createSeanceDto.date,
      max_films: createSeanceDto.max_films,
      proprietaire_id,
      statut: SeanceStatut.EN_ATTENTE,
      code: this.generateCode(),
      est_actif: true,
    });

    const savedSeance = await this.seancesRepository.save(seance);

    // Ajouter le propriétaire comme participant automatiquement
    const participant = this.participantsRepository.create({
      seance_id: savedSeance.id,
      utilisateur_id: proprietaire_id,
    });
    await this.participantsRepository.save(participant);

    return savedSeance;
  }

  // Rejoindre une séance via son code
  async join(
    code: string,
    utilisateur_id: string,
  ): Promise<{ participant: Participant; seance: Seance }> {
    const seance = await this.findByCode(code);

    if (seance.statut !== SeanceStatut.EN_ATTENTE) {
      throw new RpcException({
        statusCode: 400,
        message:
          'Impossible de rejoindre une séance déjà commencée ou terminée',
      });
    }

    // Vérifier si l'utilisateur a déjà rejoint
    const existingParticipant = await this.participantsRepository.findOneBy({
      seance_id: seance.id,
      utilisateur_id,
    });

    if (existingParticipant) {
      throw new RpcException({
        statusCode: 409,
        message: 'Vous avez déjà rejoint cette séance',
      });
    }

    const participant = this.participantsRepository.create({
      seance_id: seance.id,
      utilisateur_id,
    });

    const savedParticipant =
      await this.participantsRepository.save(participant);

    return { participant: savedParticipant, seance };
  }
  // Récupère la séance active créée par l'utilisateur
  async findByProprietaire(proprietaire_id: string): Promise<Seance | null> {
    return this.seancesRepository.findOne({
      where: { proprietaire_id, est_actif: true },
      order: { date: 'DESC' },
    });
  }
  // Trouve une séance par son code
  async findByCode(code: string): Promise<Seance> {
    const seance = await this.seancesRepository.findOneBy({
      code,
      est_actif: true,
    });

    if (!seance) {
      throw new RpcException({
        statusCode: 404,
        message: 'Séance introuvable',
      });
    }

    return seance;
  }

  // Récupère les participants d'une séance avec les infos utilisateur
  async getParticipants(seance_id: string): Promise<any[]> {
    const participants = await this.participantsRepository.find({
      where: { seance_id },
      relations: ['utilisateur'],
      order: { a_rejoint_le: 'ASC' },
    });

    return participants.map((p) => ({
      id: p.id,
      seance_id: p.seance_id,
      utilisateur_id: p.utilisateur_id,
      a_rejoint_le: p.a_rejoint_le,
      utilisateur: {
        id: p.utilisateur.id,
        nom: p.utilisateur.nom,
        email: p.utilisateur.email,
      },
    }));
  }

  // Quitter une séance (suppression d'un participant)
  async leave(seance_id: string, utilisateur_id: string) {
    const result = await this.participantsRepository.delete({
      seance_id,
      utilisateur_id,
    });

    if (result.affected === 0) {
      throw new RpcException({
        statusCode: 404,
        message: "Vous n'avez pas rejoint cette séance",
      });
    }

    return { message: 'Vous avez quitté la séance' };
  }

  // Mettre à jour le statut d'une séance (seul le propriétaire peut le faire)
  async updateStatut(
    seance_id: string,
    proprietaire_id: string,
    nouveauStatut: SeanceStatut,
  ): Promise<Seance> {
    const seance = await this.seancesRepository.findOneBy({
      id: seance_id,
      proprietaire_id,
    });

    if (!seance) {
      throw new RpcException({
        statusCode: 404,
        message: "Séance introuvable ou vous n'êtes pas le propriétaire",
      });
    }

    seance.statut = nouveauStatut;
    return this.seancesRepository.save(seance);
  }
}
