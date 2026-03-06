import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { Seance, SeanceStatut } from 'schemas/seance.entity';
import { Participant } from 'schemas/participant.entity';
import { PropositionFilm } from 'schemas/proposition-film.entity';
import { VoteClassement } from 'schemas/vote-classement.entity';
import { User, UserRole } from 'schemas/user.entity';
import { logAction, logSuccess, logError } from '@workspace/logger';

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
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

  // Verify user exists in database before creating FK relationships
  // This prevents FK constraint violations due to transaction visibility lag between microservices
  private async verifyUserExists(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id'],
    });
    
    if (!user) {
      logError('ms-sessions', `User ${userId} not found in database - potential sync issue between services`);
      throw new RpcException({
        statusCode: 404,
        message: `User ${userId} not found in database. This may indicate a synchronization issue between services.`,
      });
    }
  }

  // Check if user is a guest
  private async isGuestUser(userId: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['role'],
    });
    return user?.role === UserRole.GUEST;
  }

  findAll(): Promise<Seance[]> {
    return this.seancesRepository.find();
  }

  // Crée une nouvelle séance
  async create(
    createSeanceDto: { nom: string; date: Date; max_films: number },
    proprietaire_id: string,
  ): Promise<Seance> {
    logAction('ms-sessions', `Creating session for user ${proprietaire_id}`);
    // CRITICAL: Verify user exists before starting session creation
    // This prevents FK constraint violation when adding owner as participant
    await this.verifyUserExists(proprietaire_id);

    const existingSeance = await this.findByProprietaire(proprietaire_id);
    if (existingSeance) {
      // Si la séance existante est terminée ou annulée, on la nettoie silencieusement
      if (
        existingSeance.statut === SeanceStatut.TERMINEE ||
        existingSeance.statut === SeanceStatut.ANNULEE
      ) {
        await this.seancesRepository.delete({ id: existingSeance.id });
      } else {
        logError('ms-sessions', `User ${proprietaire_id} already has an active session`);
        throw new RpcException({
          statusCode: 409,
          message: 'Vous avez déjà une séance active...',
        });
      }
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

    logSuccess('ms-sessions', `Session created: ${savedSeance.id} with code ${savedSeance.code}`);
    return savedSeance;
  }

  // Rejoindre une séance via son code
  async join(
    code: string,
    utilisateur_id: string,
  ): Promise<{ participant: Participant; seance: Seance }> {
    logAction('ms-sessions', `User ${utilisateur_id} joining session with code ${code}`);
    const seance = await this.findByCode(code);

    if (seance.statut !== SeanceStatut.EN_ATTENTE) {
      logError('ms-sessions', `User ${utilisateur_id} cannot join session ${seance.id} - status is ${seance.statut}`);
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
      logError('ms-sessions', `User ${utilisateur_id} already joined session ${seance.id}`);
      throw new RpcException({
        statusCode: 409,
        message: 'Vous avez déjà rejoint cette séance',
      });
    }

    // Prevent guest users from joining multiple lobbies
    const isGuest = await this.isGuestUser(utilisateur_id);
    if (isGuest) {
      const activeSession = await this.findActiveSeanceForUser(utilisateur_id);
      if (activeSession && activeSession.id !== seance.id) {
        logError('ms-sessions', `Guest user ${utilisateur_id} can only join one lobby at a time - already in session ${activeSession.id}`);
        throw new RpcException({
          statusCode: 403,
          message: 'As a guest, you can only join one lobby at a time. Please leave your current lobby first.',
        });
      }
    }

    // CRITICAL: Verify user exists before creating FK relationship
    // This prevents FK constraint violation errors due to transaction visibility lag
    await this.verifyUserExists(utilisateur_id);

    const participant = this.participantsRepository.create({
      seance_id: seance.id,
      utilisateur_id,
    });

    const savedParticipant =
      await this.participantsRepository.save(participant);

    logSuccess('ms-sessions', `User ${utilisateur_id} joined session ${seance.id}`);
    return { participant: savedParticipant, seance };
  }
  // Récupère la séance active créée par l'utilisateur (exclut terminées et annulées)
  async findByProprietaire(proprietaire_id: string): Promise<Seance | null> {
    return this.seancesRepository.findOne({
      where: [
        { proprietaire_id, statut: SeanceStatut.EN_ATTENTE },
        { proprietaire_id, statut: SeanceStatut.EN_COURS },
      ],
      order: { date: 'DESC' },
    });
  }

  // Récupère la séance active de l'utilisateur (proprio ou participant)
  async findActiveSeanceForUser(
    utilisateur_id: string,
  ): Promise<Seance | null> {
    // Vérifie d'abord si l'utilisateur est propriétaire d'une séance en cours
    const ownedSeance = await this.findByProprietaire(utilisateur_id);
    if (ownedSeance) return ownedSeance;

    // Sinon, cherche parmi les participations dont la séance est encore active
    const participant = await this.participantsRepository.findOne({
      where: { utilisateur_id },
      relations: ['seance'],
      order: { a_rejoint_le: 'DESC' },
    });

    const seance = participant?.seance;
    if (
      seance &&
      seance.statut !== SeanceStatut.TERMINEE &&
      seance.statut !== SeanceStatut.ANNULEE
    ) {
      return seance;
    }
    return null;
  }

  // Récupère toutes les séances actives de l'utilisateur (owned + participated)
  async findAllSessionsForUser(
    utilisateur_id: string,
  ): Promise<{ owned: Seance | null; participated: Seance[] }> {
    // Récupérer la séance possédée
    const ownedSeance = await this.findByProprietaire(utilisateur_id);

    // Récupérer toutes les participations actives
    const participants = await this.participantsRepository.find({
      where: { utilisateur_id },
      relations: ['seance'],
      order: { a_rejoint_le: 'DESC' },
    });

    // Filtrer pour ne garder que les séances actives
    const participatedSessions = participants
      .map((p) => p.seance)
      .filter(
        (seance) =>
          seance.statut !== SeanceStatut.TERMINEE &&
          seance.statut !== SeanceStatut.ANNULEE &&
          // Exclure la séance possédée des participations
          seance.id !== ownedSeance?.id,
      );

    return {
      owned: ownedSeance,
      participated: participatedSessions,
    };
  }
  // Trouve une séance par son code (uniquement si en attente)
  async findByCode(code: string): Promise<Seance> {
    const seance = await this.seancesRepository.findOneBy({
      code,
      statut: SeanceStatut.EN_ATTENTE,
    });

    if (!seance) {
      logError('ms-sessions', `Session not found or already started with code: ${code}`);
      throw new RpcException({
        statusCode: 404,
        message: 'Séance introuvable ou déjà commencée',
      });
    }

    return seance;
  }

  // Vérifie si un code de séance existe et est valide
  async checkCodeExists(code: string): Promise<{ exists: boolean }> {
    const seance = await this.seancesRepository.findOneBy({
      code,
      statut: SeanceStatut.EN_ATTENTE,
    });

    if (!seance) {
      logError('ms-sessions', `Invalid code or session unavailable: ${code}`);
      throw new RpcException({
        statusCode: 404,
        message: 'Code invalide ou session indisponible',
      });
    }

    return { exists: true };
  }

  // Récupère les participants d'une séance avec les infos utilisateur
  async getParticipants(seance_id: string): Promise<any[]> {
    const seance = await this.seancesRepository.findOneBy({ id: seance_id });
    if (!seance) {
      logError('ms-sessions', `Session not found: ${seance_id}`);
      throw new RpcException({
        statusCode: 404,
        message: 'Séance introuvable',
      });
    }

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

  // Vérifie si un utilisateur est propriétaire ou participant d'une séance
  async checkParticipant(
    seance_id: string,
    utilisateur_id: string,
  ): Promise<{ isAuthorized: boolean }> {
    const seance = await this.seancesRepository.findOneBy({ id: seance_id });

    if (!seance) {
      throw new RpcException({
        statusCode: 404,
        message: 'Séance introuvable',
      });
    }

    // Check if user is the owner
    if (seance.proprietaire_id === utilisateur_id) {
      return { isAuthorized: true };
    }

    // Check if user is a participant
    const participant = await this.participantsRepository.findOneBy({
      seance_id,
      utilisateur_id,
    });

    if (participant) {
      return { isAuthorized: true };
    }

    return { isAuthorized: false };
  }

  // Supprimer une séance (hôte uniquement — supprime aussi les participants en cascade)
  async deleteSeance(seance_id: string, proprietaire_id: string) {
    logAction('ms-sessions', `Deleting session ${seance_id} by owner ${proprietaire_id}`);
    const seance = await this.seancesRepository.findOneBy({
      id: seance_id,
      proprietaire_id,
    });

    if (!seance) {
      logError('ms-sessions', `Cannot delete session ${seance_id} - not found or user ${proprietaire_id} is not owner`);
      throw new RpcException({
        statusCode: 404,
        message: "Séance introuvable ou vous n'êtes pas le propriétaire",
      });
    }

    await this.seancesRepository.delete({ id: seance_id });
    logSuccess('ms-sessions', `Session ${seance_id} deleted successfully`);
    return { message: 'Séance supprimée' };
  }

  // Quitter une séance : si proprio → supprime la séance, sinon → quitte comme participant
  async leave(seance_id: string, utilisateur_id: string) {
    logAction('ms-sessions', `User ${utilisateur_id} leaving session ${seance_id}`);
    const seance = await this.seancesRepository.findOneBy({ id: seance_id });

    if (!seance) {
      // Séance déjà supprimée, nettoyer quand même la participation si elle existe
      await this.participantsRepository.delete({ seance_id, utilisateur_id });
      return { message: 'Séance déjà supprimée' };
    }

    if (seance.proprietaire_id === utilisateur_id) {
      // L'hôte quitte → supprimer toute la séance (participants en cascade)
      await this.seancesRepository.delete({ id: seance_id });
      logSuccess('ms-sessions', `Session ${seance_id} deleted by owner leaving`);
      return { message: 'Séance supprimée' };
    }

    // Participant normal → retirer uniquement sa participation
    const result = await this.participantsRepository.delete({
      seance_id,
      utilisateur_id,
    });

    if (result.affected === 0) {
      logError('ms-sessions', `User ${utilisateur_id} cannot leave session ${seance_id} - not a participant`);
      throw new RpcException({
        statusCode: 404,
        message: "Vous n'avez pas rejoint cette séance",
      });
    }

    logSuccess('ms-sessions', `User ${utilisateur_id} left session ${seance_id}`);
    return { message: 'Vous avez quitté la séance' };
  }

  // Mettre à jour le statut d'une séance (seul le propriétaire peut le faire)
  async updateStatut(
    seance_id: string,
    proprietaire_id: string,
    nouveauStatut: SeanceStatut,
  ): Promise<Seance> {
    logAction('ms-sessions', `Updating session ${seance_id} status to ${nouveauStatut}`);
    const seance = await this.seancesRepository.findOneBy({
      id: seance_id,
      proprietaire_id,
    });

    if (!seance) {
      logError('ms-sessions', `Cannot update session ${seance_id} status - not found or user ${proprietaire_id} is not owner`);
      throw new RpcException({
        statusCode: 404,
        message: "Séance introuvable ou vous n'êtes pas le propriétaire",
      });
    }

    seance.statut = nouveauStatut;
    const updated = await this.seancesRepository.save(seance);
    logSuccess('ms-sessions', `Session ${seance_id} status updated to ${nouveauStatut}`);
    return updated;
  }

  // Soumettre les propositions de films d'un participant
  async submitPropositions(
    seance_id: string,
    utilisateur_id: string,
    tmdb_ids: number[],
  ): Promise<{ message: string }> {
    logAction('ms-sessions', `User ${utilisateur_id} submitting ${tmdb_ids.length} film proposals for session ${seance_id}`);
    // CRITICAL: Verify user exists before creating FK relationship
    // This prevents FK constraint violation errors due to transaction visibility lag
    await this.verifyUserExists(utilisateur_id);

    // Vérifier que la séance existe
    const seance = await this.seancesRepository.findOneBy({ id: seance_id });
    if (!seance) {
      logError('ms-sessions', `Cannot submit proposals for session ${seance_id} - session not found`);
      throw new RpcException({
        statusCode: 404,
        message: 'Séance introuvable',
      });
    }

    // Supprimer les anciennes propositions de cet utilisateur pour cette séance
    await this.propositionsRepository.delete({ seance_id, utilisateur_id });

    const propositions = tmdb_ids.map((tmdb_id) =>
      this.propositionsRepository.create({
        seance_id,
        utilisateur_id,
        tmdb_id,
      }),
    );
    await this.propositionsRepository.save(propositions);
    logSuccess('ms-sessions', `Film proposals saved for user ${utilisateur_id} in session ${seance_id}`);
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
    logAction('ms-sessions', `User ${utilisateur_id} submitting ranking for session ${seance_id}`);
    // CRITICAL: Verify user exists before creating FK relationship
    // This prevents FK constraint violation errors due to transaction visibility lag
    await this.verifyUserExists(utilisateur_id);

    // Vérifier que la séance existe
    const seance = await this.seancesRepository.findOneBy({ id: seance_id });
    if (!seance) {
      logError('ms-sessions', `Cannot submit ranking for session ${seance_id} - session not found`);
      throw new RpcException({
        statusCode: 404,
        message: 'Séance introuvable',
      });
    }

    // Remplacer l'éventuel classement précédent
    await this.votesRepository.delete({ seance_id, utilisateur_id });

    const votes = classement.map(({ tmdb_id, rang }) =>
      this.votesRepository.create({ seance_id, utilisateur_id, tmdb_id, rang }),
    );
    await this.votesRepository.save(votes);
    logSuccess('ms-sessions', `Ranking saved for user ${utilisateur_id} in session ${seance_id}`);
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
    logAction('ms-sessions', `Computing final results for session ${seance_id}`);
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
    logSuccess('ms-sessions', `Final results computed for session ${seance_id}: ${result.length} films ranked`);
    return result;
  }
}
