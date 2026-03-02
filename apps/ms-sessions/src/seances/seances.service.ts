import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { Seance, SeanceStatut } from 'schemas/seance.entity';
import { Participant } from 'schemas/participant.entity';
import { PropositionFilm } from 'schemas/proposition-film.entity';
import { VoteClassement } from 'schemas/vote-classement.entity';

@Injectable()
export class SeancesService {
  constructor(
    @InjectRepository(Seance)
    private readonly seancesRepository: Repository<Seance>,
    @InjectRepository(Participant)
    private readonly participantsRepository: Repository<Participant>,
    @InjectRepository(PropositionFilm)
    private readonly propositionsRepository: Repository<PropositionFilm>,
    @InjectRepository(VoteClassement)
    private readonly votesRepository: Repository<VoteClassement>,
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

  // Récupère la séance active de l'utilisateur (proprio ou participant)
  async findActiveSeanceForUser(utilisateur_id: string): Promise<Seance | null> {
    // Vérifie d'abord si l'utilisateur est propriétaire
    const ownedSeance = await this.findByProprietaire(utilisateur_id);
    if (ownedSeance) return ownedSeance;

    // Sinon, cherche parmi les participations actives
    const participant = await this.participantsRepository.findOne({
      where: { utilisateur_id },
      relations: ['seance'],
      order: { a_rejoint_le: 'DESC' },
    });

    if (participant?.seance?.est_actif) return participant.seance;
    return null;
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

  // Supprimer une séance (hôte uniquement — supprime aussi les participants en cascade)
  async deleteSeance(seance_id: string, proprietaire_id: string) {
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

    await this.seancesRepository.delete({ id: seance_id });
    return { message: 'Séance supprimée' };
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

  // Soumettre les propositions de films d'un participant
  async submitPropositions(
    seance_id: string,
    utilisateur_id: string,
    tmdb_ids: number[],
  ): Promise<{ message: string }> {
    // Supprimer les anciennes propositions de cet utilisateur pour cette séance
    await this.propositionsRepository.delete({ seance_id, utilisateur_id });

    const propositions = tmdb_ids.map((tmdb_id) =>
      this.propositionsRepository.create({ seance_id, utilisateur_id, tmdb_id }),
    );
    await this.propositionsRepository.save(propositions);
    return { message: 'Propositions enregistrées' };
  }

  // Récupérer toutes les propositions d'une séance (tous participants)
  async getPropositions(seance_id: string): Promise<PropositionFilm[]> {
    return this.propositionsRepository.find({
      where: { seance_id },
      order: { propose_le: 'ASC' },
    });
  }

  // Vérifier si tous les participants ont soumis leurs propositions
  async allParticipantsSubmitted(seance_id: string): Promise<boolean> {
    const participants = await this.participantsRepository.find({
      where: { seance_id },
    });
    if (participants.length === 0) return false;

    for (const p of participants) {
      const count = await this.propositionsRepository.count({
        where: { seance_id, utilisateur_id: p.utilisateur_id },
      });
      if (count === 0) return false;
    }
    return true;
  }

  // Soumettre le classement d'un participant (rang 1 = préféré)
  async submitClassement(
    seance_id: string,
    utilisateur_id: string,
    classement: { tmdb_id: number; rang: number }[],
  ): Promise<{ message: string }> {
    // Remplacer l'éventuel classement précédent
    await this.votesRepository.delete({ seance_id, utilisateur_id });

    const votes = classement.map(({ tmdb_id, rang }) =>
      this.votesRepository.create({ seance_id, utilisateur_id, tmdb_id, rang }),
    );
    await this.votesRepository.save(votes);
    return { message: 'Classement enregistré' };
  }

  // Vérifier si tous les participants ont soumis leur classement
  async allClassementsSubmitted(seance_id: string): Promise<boolean> {
    const participants = await this.participantsRepository.find({
      where: { seance_id },
    });
    if (participants.length === 0) return false;

    for (const p of participants) {
      const count = await this.votesRepository.count({
        where: { seance_id, utilisateur_id: p.utilisateur_id },
      });
      if (count === 0) return false;
    }
    return true;
  }

  // Calculer le résultat final : moyenne des rangs par film, trié du meilleur au moins bon
  async getResultatFinal(
    seance_id: string,
  ): Promise<{ tmdb_id: number; rang_moyen: number }[]> {
    const votes = await this.votesRepository.find({ where: { seance_id } });

    // Regrouper les rangs par tmdb_id
    const map = new Map<number, number[]>();
    for (const v of votes) {
      if (!map.has(v.tmdb_id)) map.set(v.tmdb_id, []);
      map.get(v.tmdb_id)!.push(v.rang);
    }

    const result = Array.from(map.entries()).map(([tmdb_id, rangs]) => ({
      tmdb_id,
      rang_moyen: rangs.reduce((a, b) => a + b, 0) / rangs.length,
    }));

    // Trier par rang moyen croissant (1 = meilleur)
    result.sort((a, b) => a.rang_moyen - b.rang_moyen);
    return result;
  }
}
