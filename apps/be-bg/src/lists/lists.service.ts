import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Liste } from './entities/liste.entity';
import { ListeFilm } from './entities/liste-film.entity';

@Injectable()
export class ListesService {
  constructor(
    @InjectRepository(Liste)
    private readonly listesRepository: Repository<Liste>,
    @InjectRepository(ListeFilm)
    private readonly listeFilmsRepository: Repository<ListeFilm>,
  ) {}
  findAll(): Promise<Liste[]> {
    return this.listesRepository.find();
  }

  findOneById(id : string ): Promise<Liste | null> {
    return this.listesRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.listesRepository.delete(id);
  }
  async findAllByUser(userId: string): Promise<Liste[]> {
    return this.listesRepository.find({
      where: { utilisateur_id: userId },
      order: { cree_le: 'DESC' },
    });
  }

  //Récupère une liste par ID 
  findOne(listeId: string,userId: string,): Promise<Liste | null> {
    return this.listesRepository.findOne({
      where: {
        id: listeId,
        utilisateur_id: userId,
      },
    });
  }
  // Créer une nouvelle liste
  async create(userId: string,nom: string,description?: string,): Promise<Liste> {
    const liste = this.listesRepository.create({
      nom,
      description,
      utilisateur_id: userId,
    });

    return this.listesRepository.save(liste);
  }

  // Supprimer une liste
  async delete(listeId: string,userId: string,): Promise<boolean> {
    const res = await this.listesRepository.delete({
      id: listeId,
      utilisateur_id: userId,
    });

    return (res.affected ?? 0) > 0;
  }

  //Ajouter un film à une liste
  async addFilmToList(listeId: string,tmdbId: number,userId: string,): Promise<ListeFilm | null> {
    const liste = await this.findOne(listeId, userId);
    if (!liste) return null;

    const film = this.listeFilmsRepository.create({
      liste_id: listeId,
      tmdb_id: tmdbId,
    });

    try {
      return await this.listeFilmsRepository.save(film);
    } catch {
      return film;
    }
  }

  // Retirer un film d'une liste
  async removeFilmFromList(listeId: string,tmdbId: number,userId: string,): Promise<boolean> {
    const liste = await this.findOne(listeId, userId);
    if (!liste) return false;

    const res = await this.listeFilmsRepository.delete({
      liste_id: listeId,
      tmdb_id: tmdbId,
    });

    return (res.affected ?? 0) > 0;
  }

  //Récupérer les films d'une liste
  async getFilmsInList(listeId: string,userId: string,): Promise<number[]> {
    const liste = await this.findOne(listeId, userId);
    if (!liste) return [];

    const films = await this.listeFilmsRepository.find({
      where: { liste_id: listeId },
      order: { cree_le: 'DESC' },
    });

    return films.map((film) => film.tmdb_id);
  }

  // Listes + films
  async findAllByUserWithFilms(userId: string,): Promise<(Omit<Liste, 'films'> & { films: number[] })[]> {
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