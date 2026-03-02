import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListsService } from './lists.service';
import { Liste } from 'schemas/liste.entity';
import { ListeFilm } from 'schemas/liste-film.entity';

describe('ListsService', () => {
  let service: ListsService;

  // On mock les deux repositories utilises par le service
  // Ca permet de tester la logique metier sans toucher a la BDD
  const mockListeRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  const mockListeFilmRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  // Donnees de test reutilisees partout
  const mockUserId = 'user-123';
  const mockListeId = 'liste-456';
  const mockTmdbId = 12345;

  const mockListe = {
    id: mockListeId,
    nom: 'Ma liste',
    description: 'Description',
    utilisateur_id: mockUserId,
    cree_le: new Date(),
    maj_le: new Date(),
    films: [],
  } as unknown as Liste;

  const mockListeFilm = {
    id: 'listefilm-789',
    liste_id: mockListeId,
    tmdb_id: mockTmdbId,
    cree_le: new Date(),
  } as unknown as ListeFilm;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListsService,
        {
          provide: getRepositoryToken(Liste),
          useValue: mockListeRepository,
        },
        {
          provide: getRepositoryToken(ListeFilm),
          useValue: mockListeFilmRepository,
        },
      ],
    }).compile();

    service = module.get<ListsService>(ListsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---- Recuperation de toutes les listes ----

  describe('findAll', () => {
    it('doit retourner toutes les listes', async () => {
      mockListeRepository.find.mockResolvedValue([mockListe]);

      const result = await service.findAll();

      expect(result).toEqual([mockListe]);
      expect(mockListeRepository.find).toHaveBeenCalled();
    });
  });

  // ---- Recherche par ID simple ----

  describe('findOneById', () => {
    it('doit retourner une liste par son id', async () => {
      mockListeRepository.findOneBy.mockResolvedValue(mockListe);

      const result = await service.findOneById(mockListeId);

      expect(result).toEqual(mockListe);
      expect(mockListeRepository.findOneBy).toHaveBeenCalledWith({
        id: mockListeId,
      });
    });

    it('doit retourner null si non trouvee', async () => {
      mockListeRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOneById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ---- Listes par utilisateur (trie par date decroissante) ----

  describe('findAllByUser', () => {
    it("doit retourner toutes les listes d'un utilisateur", async () => {
      mockListeRepository.find.mockResolvedValue([mockListe]);

      const result = await service.findAllByUser(mockUserId);

      expect(result).toEqual([mockListe]);
      expect(mockListeRepository.find).toHaveBeenCalledWith({
        where: { utilisateur_id: mockUserId },
        order: { cree_le: 'DESC' },
      });
    });

    it('doit retourner un tableau vide si pas de listes', async () => {
      mockListeRepository.find.mockResolvedValue([]);

      const result = await service.findAllByUser(mockUserId);

      expect(result).toEqual([]);
    });
  });

  // ---- Recherche par ID + verification proprietaire ----

  describe('findOne', () => {
    it('doit retourner une liste par id et utilisateur', async () => {
      mockListeRepository.findOne.mockResolvedValue(mockListe);

      const result = await service.findOne(mockListeId, mockUserId);

      expect(result).toEqual(mockListe);
      expect(mockListeRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockListeId,
          utilisateur_id: mockUserId,
        },
      });
    });

    it('doit retourner null si non trouvee', async () => {
      mockListeRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('nonexistent', mockUserId);

      expect(result).toBeNull();
    });
  });

  // ---- Creation d'une liste ----

  describe('create', () => {
    it('doit creer une nouvelle liste avec description', async () => {
      mockListeRepository.create.mockReturnValue(mockListe);
      mockListeRepository.save.mockResolvedValue(mockListe);

      const result = await service.create(
        mockUserId,
        'Ma liste',
        'Description',
      );

      expect(result).toEqual(mockListe);
      expect(mockListeRepository.create).toHaveBeenCalledWith({
        nom: 'Ma liste',
        description: 'Description',
        utilisateur_id: mockUserId,
      });
      expect(mockListeRepository.save).toHaveBeenCalled();
    });

    it('doit creer une nouvelle liste sans description', async () => {
      const listeWithoutDesc = {
        ...mockListe,
        description: null as unknown as string,
      };
      mockListeRepository.create.mockReturnValue(listeWithoutDesc);
      mockListeRepository.save.mockResolvedValue(listeWithoutDesc);

      const result = await service.create(mockUserId, 'Ma liste');

      expect(result).toEqual(listeWithoutDesc);
      expect(mockListeRepository.create).toHaveBeenCalledWith({
        nom: 'Ma liste',
        description: undefined,
        utilisateur_id: mockUserId,
      });
    });
  });

  // ---- Modification d'une liste ----

  describe('update', () => {
    it('doit modifier le nom et la description', async () => {
      const updatedListe = {
        ...mockListe,
        nom: 'Nouveau nom',
        description: 'Nouvelle desc',
      };
      mockListeRepository.findOne.mockResolvedValue({ ...mockListe });
      mockListeRepository.save.mockResolvedValue(updatedListe);

      const result = await service.update(
        mockListeId,
        mockUserId,
        'Nouveau nom',
        'Nouvelle desc',
      );

      expect(result).toEqual(updatedListe);
      expect(mockListeRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockListeId, utilisateur_id: mockUserId },
      });
      expect(mockListeRepository.save).toHaveBeenCalled();
    });

    it("doit retourner null si la liste n'existe pas", async () => {
      mockListeRepository.findOne.mockResolvedValue(null);

      const result = await service.update(
        mockListeId,
        mockUserId,
        'Nouveau nom',
      );

      expect(result).toBeNull();
      expect(mockListeRepository.save).not.toHaveBeenCalled();
    });
  });

  // ---- Suppression d'une liste ----

  describe('delete', () => {
    it('doit supprimer une liste et retourner true', async () => {
      mockListeRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.delete(mockListeId, mockUserId);

      expect(result).toBe(true);
      expect(mockListeRepository.delete).toHaveBeenCalledWith({
        id: mockListeId,
        utilisateur_id: mockUserId,
      });
    });

    it('doit retourner false si liste non trouvee', async () => {
      mockListeRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await service.delete('nonexistent', mockUserId);

      expect(result).toBe(false);
    });
  });

  // ---- Ajout d'un film a une liste ----

  describe('addFilmToList', () => {
    it('doit ajouter un film a une liste', async () => {
      mockListeRepository.findOne.mockResolvedValue(mockListe);
      mockListeFilmRepository.create.mockReturnValue(mockListeFilm);
      mockListeFilmRepository.save.mockResolvedValue(mockListeFilm);

      const result = await service.addFilmToList(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );

      expect(result).toEqual(mockListeFilm);
      expect(mockListeFilmRepository.create).toHaveBeenCalledWith({
        liste_id: mockListeId,
        tmdb_id: mockTmdbId,
      });
    });

    it("doit retourner null si la liste n'appartient pas a l'utilisateur", async () => {
      mockListeRepository.findOne.mockResolvedValue(null);

      const result = await service.addFilmToList(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );

      expect(result).toBeNull();
    });

    it('doit retourner le film cree si erreur (doublon)', async () => {
      const createdFilm = {
        liste_id: mockListeId,
        tmdb_id: mockTmdbId,
      } as unknown as ListeFilm;
      mockListeRepository.findOne.mockResolvedValue(mockListe);
      mockListeFilmRepository.create.mockReturnValue(createdFilm);
      mockListeFilmRepository.save.mockRejectedValue(new Error('Duplicate'));

      const result = await service.addFilmToList(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );

      expect(result).toMatchObject({
        liste_id: mockListeId,
        tmdb_id: mockTmdbId,
      });
    });
  });

  // ---- Retrait d'un film d'une liste ----

  describe('removeFilmFromList', () => {
    it("doit supprimer un film d'une liste et retourner true", async () => {
      mockListeRepository.findOne.mockResolvedValue(mockListe);
      mockListeFilmRepository.delete.mockResolvedValue({
        affected: 1,
        raw: {},
      });

      const result = await service.removeFilmFromList(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );

      expect(result).toBe(true);
    });

    it("doit retourner false si la liste n'appartient pas a l'utilisateur", async () => {
      mockListeRepository.findOne.mockResolvedValue(null);

      const result = await service.removeFilmFromList(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );

      expect(result).toBe(false);
    });
  });

  // ---- Recuperer les IDs TMDB des films d'une liste ----

  describe('getFilmsInList', () => {
    it("doit retourner tous les ids de films d'une liste", async () => {
      mockListeRepository.findOne.mockResolvedValue(mockListe);
      mockListeFilmRepository.find.mockResolvedValue([
        { ...mockListeFilm, tmdb_id: 123 } as unknown as ListeFilm,
        { ...mockListeFilm, tmdb_id: 456 } as unknown as ListeFilm,
      ]);

      const result = await service.getFilmsInList(mockListeId, mockUserId);

      expect(result).toEqual([123, 456]);
    });

    it("doit retourner un tableau vide si la liste n'appartient pas a l'utilisateur", async () => {
      mockListeRepository.findOne.mockResolvedValue(null);

      const result = await service.getFilmsInList(mockListeId, mockUserId);

      expect(result).toEqual([]);
    });
  });

  // ---- Listes avec films ----

  describe('findAllByUserWithFilms', () => {
    it('doit retourner toutes les listes avec leurs films', async () => {
      const liste1 = {
        ...mockListe,
        id: 'liste-1',
        films: [{ tmdb_id: 111 }, { tmdb_id: 222 }] as unknown as ListeFilm[],
      };
      const liste2 = {
        ...mockListe,
        id: 'liste-2',
        nom: 'Liste 2',
        films: [{ tmdb_id: 333 }] as unknown as ListeFilm[],
      };

      mockListeRepository.find.mockResolvedValue([
        liste1,
        liste2,
      ] as unknown as Liste[]);

      const result = await service.findAllByUserWithFilms(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].films).toEqual([111, 222]);
      expect(result[1].films).toEqual([333]);
    });

    it('doit retourner un tableau vide si pas de listes', async () => {
      mockListeRepository.find.mockResolvedValue([]);

      const result = await service.findAllByUserWithFilms(mockUserId);

      expect(result).toEqual([]);
    });
  });
});
