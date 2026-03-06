import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Liste } from 'schemas/liste.entity';
import { ListeFilm } from 'schemas/liste-film.entity';
import { logAction, logSuccess, logError } from '@workspace/logger';

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(Liste)
    private readonly listesRepository: Repository<Liste>,
    @InjectRepository(ListeFilm)
    private readonly listeFilmsRepository: Repository<ListeFilm>,
  ) {}

  findAll(): Promise<Liste[]> {
    return this.listesRepository.find();
  }

  findOneById(id: string): Promise<Liste | null> {
    return this.listesRepository.findOneBy({ id });
  }

  async findAllByUser(userId: string): Promise<Liste[]> {
    return this.listesRepository.find({
      where: { utilisateur_id: userId },
      order: { cree_le: 'DESC' },
    });
  }

  // Recupere une liste par ID
  findOne(listeId: string, userId: string): Promise<Liste | null> {
    return this.listesRepository.findOne({
      where: {
        id: listeId,
        utilisateur_id: userId,
      },
    });
  }

  // Creer une nouvelle liste
  async create(
    userId: string,
    nom: string,
    description?: string,
  ): Promise<Liste> {
    logAction('ms-list', `Creating list "${nom}" for user ${userId}`);
    const liste = this.listesRepository.create({
      nom,
      description,
      utilisateur_id: userId,
    });

    const saved = await this.listesRepository.save(liste);
    logSuccess('ms-list', `List ${saved.id} created successfully`);
    return saved;
  }

  // Modifier une liste (nom, description)
  async update(
    listeId: string,
    userId: string,
    nom?: string,
    description?: string,
  ): Promise<Liste | null> {
    logAction('ms-list', `Updating list ${listeId} for user ${userId}`);
    const liste = await this.findOne(listeId, userId);
    if (!liste) {
      logError('ms-list', `List ${listeId} not found for user ${userId}`);
      return null;
    }

    if (nom) liste.nom = nom;
    if (description !== undefined) liste.description = description;

    const updated = await this.listesRepository.save(liste);
    logSuccess('ms-list', `List ${listeId} updated successfully`);
    return updated;
  }

  // Supprimer une liste
  async delete(listeId: string, userId: string): Promise<boolean> {
    logAction('ms-list', `Deleting list ${listeId} for user ${userId}`);
    const res = await this.listesRepository.delete({
      id: listeId,
      utilisateur_id: userId,
    });

    const success = (res.affected ?? 0) > 0;
    if (success) {
      logSuccess('ms-list', `List ${listeId} deleted successfully`);
    } else {
      logError('ms-list', `Failed to delete list ${listeId} for user ${userId}`);
    }
    return success;
  }

  // Ajouter un film a une liste
  async addFilmToList(
    listeId: string,
    tmdbId: number,
    userId: string,
  ): Promise<ListeFilm | null> {
    logAction('ms-list', `Adding film ${tmdbId} to list ${listeId}`);
    const liste = await this.findOne(listeId, userId);
    if (!liste) {
      logError('ms-list', `List ${listeId} not found for user ${userId}`);
      return null;
    }

    const film = this.listeFilmsRepository.create({
      liste_id: listeId,
      tmdb_id: tmdbId,
    });

    try {
      const saved = await this.listeFilmsRepository.save(film);
      logSuccess('ms-list', `Film ${tmdbId} added to list ${listeId}`);
      return saved;
    } catch (error) {
      logError('ms-list', `Failed to add film ${tmdbId} to list ${listeId} (probably duplicate)`);
      return film;
    }
  }

  // Retirer un film d'une liste
  async removeFilmFromList(
    listeId: string,
    tmdbId: number,
    userId: string,
  ): Promise<boolean> {
    logAction('ms-list', `Removing film ${tmdbId} from list ${listeId}`);
    const liste = await this.findOne(listeId, userId);
    if (!liste) {
      logError('ms-list', `List ${listeId} not found for user ${userId}`);
      return false;
    }

    const res = await this.listeFilmsRepository.delete({
      liste_id: listeId,
      tmdb_id: tmdbId,
    });

    const success = (res.affected ?? 0) > 0;
    if (success) {
      logSuccess('ms-list', `Film ${tmdbId} removed from list ${listeId}`);
    }
    return success;
  }

  // Recuperer les films d'une liste
  async getFilmsInList(listeId: string, userId: string): Promise<number[]> {
    const liste = await this.findOne(listeId, userId);
    if (!liste) return [];

    const films = await this.listeFilmsRepository.find({
      where: { liste_id: listeId },
      order: { cree_le: 'DESC' },
    });

    return films.map((film) => film.tmdb_id);
  }

  // Listes + films
  async findAllByUserWithFilms(
    userId: string,
  ): Promise<(Omit<Liste, 'films'> & { films: number[] })[]> {
    const listes = await this.listesRepository.find({
      where: { utilisateur_id: userId },
      relations: ['films'],
      order: { cree_le: 'DESC' },
    });

    return listes.map((liste) => ({
      ...liste,
      films: liste.films.map((film) => film.tmdb_id),
    }));
  }
}
