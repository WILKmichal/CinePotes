import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { CreateSeanceDto } from './dto/create-seance.dto';
import { Seance, SeanceStatut } from './entities/seance.entity';
import { Participant } from './entities/participant.entity';

@Injectable()
export class SeancesService {
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
  async create(createSeanceDto: CreateSeanceDto, proprietaire_id: string): Promise<Seance> {
    const existingSeance = await this.findByProprietaire(proprietaire_id);
    if (existingSeance) {
      throw new ConflictException('Vous avez déjà une séance active. Veuillez la terminer avant d\'en créer une nouvelle.');
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

    return this.seancesRepository.save(seance);
  }


  // Rejoindre une séance via son code
  async join(code: string, utilisateur_id: string): Promise<{ participant: Participant; seance: Seance }> {
    const seance = await this.findByCode(code);

    if (seance.statut !== SeanceStatut.EN_ATTENTE) {
      throw new ConflictException('La séance n\'accepte plus de participants');
    }

    // Vérifier si l'utilisateur a déjà rejoint
    const existingParticipant = await this.participantsRepository.findOneBy({
      seance_id: seance.id,
      utilisateur_id,
    });

    if (existingParticipant) {
      throw new ConflictException('Vous avez déjà rejoint cette séance');
    }

    const participant = this.participantsRepository.create({
      seance_id: seance.id,
      utilisateur_id,
    });

    const savedParticipant = await this.participantsRepository.save(participant);

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
    const seance = await this.seancesRepository.findOneBy({ code, est_actif: true });

    if (!seance) {
      throw new NotFoundException(`Séance avec le code ${code} introuvable`);
    }

    return seance;
  }

  // Récupère les participants d'une séance avec les infos utilisateur
  async getParticipants(seance_id: string): Promise<Participant[]> {
    return this.participantsRepository.find({
      where: { seance_id },
      relations: ['utilisateur'],
      order: { a_rejoint_le: 'ASC' },
    });
  }
  // Quitter une séance (suppression d'un participant)
  async leave(seance_id: string, utilisateur_id: string) {
    const result = await this.participantsRepository.delete({ seance_id, utilisateur_id });

    if (result.affected === 0) {
      throw new NotFoundException('Vous n\'êtes pas participant de cette séance');
    }

    return { message: 'Vous avez quitté la séance' };
  }

  // Mettre à jour le statut d'une séance (seul le propriétaire peut le faire)
  async updateStatut(seance_id: string, proprietaire_id: string, nouveauStatut: SeanceStatut): Promise<Seance> {
    const seance = await this.seancesRepository.findOneBy({ id: seance_id, proprietaire_id });

    if (!seance) {
      throw new NotFoundException('Séance introuvable ou non autorisé');
    }

    seance.statut = nouveauStatut;
    return this.seancesRepository.save(seance);
  }

}
