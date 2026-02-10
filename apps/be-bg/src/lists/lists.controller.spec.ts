/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ListsController } from './lists.controller';
import { ListsService, Liste, ListeFilm } from './lists.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

describe('ListsController', () => {
  let controller: ListsController;
  let listsService: jest.Mocked<ListsService>;

  const mockUserId = 'user-123';
  const mockListeId = 'liste-456';
  const mockTmdbId = 12345;

  const mockRequest = {
    user: { sub: mockUserId },
  };

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
    const mockListsService = {
      findAllByUser: jest.fn(),
      findAllByUserWithFilms: jest.fn(),
      findOne: jest.fn(),
      getFilmsInList: jest.fn(),
      create: jest.fn(),
      addFilmToList: jest.fn(),
      delete: jest.fn(),
      removeFilmFromList: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListsController],
      providers: [
        {
          provide: ListsService,
          useValue: mockListsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ListsController>(ListsController);
    listsService = module.get(ListsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all lists for the user', async () => {
      listsService.findAllByUser.mockResolvedValue([mockListe]);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual([mockListe]);
      expect(listsService.findAllByUser).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('findAllWithFilms', () => {
    it('should return all lists with films for the user', async () => {
      const listeWithFilms = { ...mockListe, films: [123, 456] };
      listsService.findAllByUserWithFilms.mockResolvedValue([listeWithFilms]);

      const result = await controller.findAllWithFilms(mockRequest);

      expect(result).toEqual([listeWithFilms]);
      expect(listsService.findAllByUserWithFilms).toHaveBeenCalledWith(
        mockUserId,
      );
    });
  });

  describe('findOne', () => {
    it('should return a specific list', async () => {
      listsService.findOne.mockResolvedValue(mockListe);

      const result = await controller.findOne(mockListeId, mockRequest);

      expect(result).toEqual(mockListe);
      expect(listsService.findOne).toHaveBeenCalledWith(
        mockListeId,
        mockUserId,
      );
    });

    it('should throw NotFoundException when list not found', async () => {
      listsService.findOne.mockResolvedValue(undefined);

      await expect(
        controller.findOne(mockListeId, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFilms', () => {
    it('should return films in a list', async () => {
      listsService.findOne.mockResolvedValue(mockListe);
      listsService.getFilmsInList.mockResolvedValue([123, 456]);

      const result = await controller.getFilms(mockListeId, mockRequest);

      expect(result).toEqual({ listeId: mockListeId, films: [123, 456] });
    });

    it('should throw NotFoundException when list not found', async () => {
      listsService.findOne.mockResolvedValue(undefined);

      await expect(
        controller.getFilms(mockListeId, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new list with description', async () => {
      listsService.create.mockResolvedValue(mockListe);

      const result = await controller.create(
        { nom: 'Ma liste', description: 'Description' },
        mockRequest,
      );

      expect(result).toEqual(mockListe);
      expect(listsService.create).toHaveBeenCalledWith(
        mockUserId,
        'Ma liste',
        'Description',
      );
    });

    it('should create a new list without description', async () => {
      const listeWithoutDesc = { ...mockListe, description: undefined };
      listsService.create.mockResolvedValue(listeWithoutDesc);

      const result = await controller.create({ nom: 'Ma liste' }, mockRequest);

      expect(result).toEqual(listeWithoutDesc);
      expect(listsService.create).toHaveBeenCalledWith(
        mockUserId,
        'Ma liste',
        undefined,
      );
    });

    it('should trim whitespace from nom and description', async () => {
      listsService.create.mockResolvedValue(mockListe);

      await controller.create(
        { nom: '  Ma liste  ', description: '  Description  ' },
        mockRequest,
      );

      expect(listsService.create).toHaveBeenCalledWith(
        mockUserId,
        'Ma liste',
        'Description',
      );
    });

    it('should throw BadRequestException when nom is empty', async () => {
      await expect(controller.create({ nom: '' }, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when nom is only whitespace', async () => {
      await expect(
        controller.create({ nom: '   ' }, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when nom is undefined', async () => {
      await expect(
        controller.create({ nom: undefined as unknown as string }, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addFilm', () => {
    it('should add a film to a list', async () => {
      listsService.addFilmToList.mockResolvedValue(mockListeFilm);

      const result = await controller.addFilm(
        mockListeId,
        { tmdbId: mockTmdbId },
        mockRequest,
      );

      expect(result).toEqual({
        message: 'Film ajouté à la liste',
        ...mockListeFilm,
      });
      expect(listsService.addFilmToList).toHaveBeenCalledWith(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );
    });

    it('should throw BadRequestException when tmdbId is missing', async () => {
      await expect(
        controller.addFilm(
          mockListeId,
          { tmdbId: undefined as unknown as number },
          mockRequest,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when tmdbId is 0', async () => {
      await expect(
        controller.addFilm(mockListeId, { tmdbId: 0 }, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when list not found or access denied', async () => {
      listsService.addFilmToList.mockResolvedValue(null);

      await expect(
        controller.addFilm(mockListeId, { tmdbId: mockTmdbId }, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete a list', async () => {
      listsService.delete.mockResolvedValue(true);

      await expect(
        controller.delete(mockListeId, mockRequest),
      ).resolves.toBeUndefined();
      expect(listsService.delete).toHaveBeenCalledWith(mockListeId, mockUserId);
    });

    it('should throw NotFoundException when list not found', async () => {
      listsService.delete.mockResolvedValue(false);

      await expect(controller.delete(mockListeId, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeFilm', () => {
    it('should remove a film from a list', async () => {
      listsService.removeFilmFromList.mockResolvedValue(true);

      await expect(
        controller.removeFilm(mockListeId, String(mockTmdbId), mockRequest),
      ).resolves.toBeUndefined();
      expect(listsService.removeFilmFromList).toHaveBeenCalledWith(
        mockListeId,
        mockTmdbId,
        mockUserId,
      );
    });

    it('should throw NotFoundException when film or list not found', async () => {
      listsService.removeFilmFromList.mockResolvedValue(false);

      await expect(
        controller.removeFilm(mockListeId, String(mockTmdbId), mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
