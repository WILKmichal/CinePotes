import { Test, TestingModule } from '@nestjs/testing';
import { ListsService, Liste, ListeFilm } from './lists.service';
import { PG_POOL } from '../../database/database.module';

describe('ListsService', () => {
  let service: ListsService;
  let mockPool: {
    query: jest.Mock;
  };

  const mockUserId = 'user-123';
  const mockListeId = 'liste-456';
  const mockTmdbId = 12345;

  const mockListe: Liste = {
    id: mockListeId,
    nom: 'Ma liste',
    description: 'Description',
    utilisateur_id: mockUserId,
    cree_le: new Date(),
    maj_le: new Date(),
  };

  const mockListeFilm: ListeFilm = {
    id: 'listefilm-789',
    liste_id: mockListeId,
    tmdb_id: mockTmdbId,
    cree_le: new Date(),
  };

  beforeEach(async () => {
    mockPool = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListsService,
        {
          provide: PG_POOL,
          useValue: mockPool,
        },
      ],
    }).compile();

    service = module.get<ListsService>(ListsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUser', () => {
    it('should return all lists for a user', async () => {
      mockPool.query.mockResolvedValue({ rows: [mockListe] });

      const result = await service.findAllByUser(mockUserId);

      expect(result).toEqual([mockListe]);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [mockUserId],
      );
    });

    it('should return empty array when user has no lists', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.findAllByUser(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a list by id for the user', async () => {
      mockPool.query.mockResolvedValue({ rows: [mockListe] });

      const result = await service.findOne(mockListeId, mockUserId);

      expect(result).toEqual(mockListe);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND utilisateur_id = $2'),
        [mockListeId, mockUserId],
      );
    });

    it('should return undefined when list not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.findOne('nonexistent', mockUserId);

      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new list with description', async () => {
      mockPool.query.mockResolvedValue({ rows: [mockListe] });

      const result = await service.create(
        mockUserId,
        'Ma liste',
        'Description',
      );

      expect(result).toEqual(mockListe);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO liste'),
        ['Ma liste', 'Description', mockUserId],
      );
    });

    it('should create a new list without description', async () => {
      const listeWithoutDesc = { ...mockListe, description: null };
      mockPool.query.mockResolvedValue({ rows: [listeWithoutDesc] });

      const result = await service.create(mockUserId, 'Ma liste');

      expect(result).toEqual(listeWithoutDesc);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO liste'),
        ['Ma liste', null, mockUserId],
      );
    });
  });

  describe('delete', () => {
    it('should delete a list and return true', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      const result = await service.delete(mockListeId, mockUserId);

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM liste'),
        [mockListeId, mockUserId],
      );
    });

    it('should return false when list not found', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      const result = await service.delete('nonexistent', mockUserId);

      expect(result).toBe(false);
    });

    it('should handle null rowCount', async () => {
      mockPool.query.mockResolvedValue({ rowCount: null });

      const result = await service.delete(mockListeId, mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('addFilmToList', () => {
    it('should add a film to a list', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockListe] }) // findOne
        .mockResolvedValueOnce({ rows: [mockListeFilm] }); // insert

      const result = await service.addFilmToList(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );

      expect(result).toEqual(mockListeFilm);
    });

    it('should return null when list does not belong to user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // findOne returns empty

      const result = await service.addFilmToList(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );

      expect(result).toBeNull();
    });

    it('should return default object when film already exists (ON CONFLICT)', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockListe] }) // findOne
        .mockResolvedValueOnce({ rows: [] }); // insert returns empty due to ON CONFLICT

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

  describe('removeFilmFromList', () => {
    it('should remove a film from a list and return true', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockListe] }) // findOne
        .mockResolvedValueOnce({ rowCount: 1 }); // delete

      const result = await service.removeFilmFromList(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );

      expect(result).toBe(true);
    });

    it('should return false when list does not belong to user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // findOne returns empty

      const result = await service.removeFilmFromList(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );

      expect(result).toBe(false);
    });

    it('should return false when film not in list', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockListe] }) // findOne
        .mockResolvedValueOnce({ rowCount: 0 }); // delete

      const result = await service.removeFilmFromList(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );

      expect(result).toBe(false);
    });

    it('should handle null rowCount', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockListe] }) // findOne
        .mockResolvedValueOnce({ rowCount: null }); // delete

      const result = await service.removeFilmFromList(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );

      expect(result).toBe(false);
    });
  });

  describe('getFilmsInList', () => {
    it('should return all film ids in a list', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockListe] }) // findOne
        .mockResolvedValueOnce({ rows: [{ tmdb_id: 123 }, { tmdb_id: 456 }] }); // select films

      const result = await service.getFilmsInList(mockListeId, mockUserId);

      expect(result).toEqual([123, 456]);
    });

    it('should return empty array when list does not belong to user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // findOne returns empty

      const result = await service.getFilmsInList(mockListeId, mockUserId);

      expect(result).toEqual([]);
    });

    it('should return empty array when list has no films', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockListe] }) // findOne
        .mockResolvedValueOnce({ rows: [] }); // select films

      const result = await service.getFilmsInList(mockListeId, mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('findAllByUserWithFilms', () => {
    it('should return all lists with their films', async () => {
      const liste1 = { ...mockListe, id: 'liste-1' };
      const liste2 = { ...mockListe, id: 'liste-2', nom: 'Liste 2' };

      mockPool.query
        .mockResolvedValueOnce({ rows: [liste1, liste2] }) // findAllByUser
        .mockResolvedValueOnce({ rows: [liste1] }) // findOne for liste1
        .mockResolvedValueOnce({ rows: [{ tmdb_id: 111 }, { tmdb_id: 222 }] }) // getFilmsInList for liste1
        .mockResolvedValueOnce({ rows: [liste2] }) // findOne for liste2
        .mockResolvedValueOnce({ rows: [{ tmdb_id: 333 }] }); // getFilmsInList for liste2

      const result = await service.findAllByUserWithFilms(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].films).toEqual([111, 222]);
      expect(result[1].films).toEqual([333]);
    });

    it('should return empty array when user has no lists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.findAllByUserWithFilms(mockUserId);

      expect(result).toEqual([]);
    });
  });
});
