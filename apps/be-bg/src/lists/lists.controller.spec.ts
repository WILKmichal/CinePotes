/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ListsController } from './lists.controller';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { of } from 'rxjs';

describe('ListsController', () => {
  let controller: ListsController;
  let natsClient: { send: jest.Mock };

  const mockUserId = 'user-123';
  const mockListeId = 'liste-456';
  const mockTmdbId = 12345;

  // Simule la requête avec le JWT décodé (user.sub = userId)
  const mockRequest = {
    user: { sub: mockUserId },
  };

  const mockListe = {
    id: mockListeId,
    nom: 'Ma liste',
    description: 'Description',
    utilisateur_id: mockUserId,
    cree_le: new Date(),
    maj_le: new Date(),
    films: [],
  };

  const mockListeFilm = {
    id: 'listefilm-789',
    liste_id: mockListeId,
    tmdb_id: mockTmdbId,
    cree_le: new Date(),
  };

  beforeEach(async () => {
    natsClient = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListsController],
      providers: [
        {
          provide: 'NATS_SERVICE',
          useValue: natsClient,
        },
      ],
    })
      // On bypass le guard d'auth pour tester uniquement la logique du controller
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ListsController>(ListsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ---- GET /lists ----

  describe('findAll', () => {
    it('should return all lists for the user', async () => {
      natsClient.send.mockReturnValue(of([mockListe]));

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual([mockListe]);
      expect(natsClient.send).toHaveBeenCalledWith('list.findAllByUser', {
        userId: mockUserId,
      });
    });
  });

  // ---- GET /lists/with-films ----

  describe('findAllWithFilms', () => {
    it('should return all lists with films for the user', async () => {
      const listeWithFilms = { ...mockListe, films: [123, 456] };
      natsClient.send.mockReturnValue(of([listeWithFilms]));

      const result = await controller.findAllWithFilms(mockRequest);

      expect(result).toEqual([listeWithFilms]);
      expect(natsClient.send).toHaveBeenCalledWith(
        'list.findAllByUserWithFilms',
        { userId: mockUserId },
      );
    });
  });

  // ---- GET /lists/:id ----

  describe('findOne', () => {
    it('should return a specific list', async () => {
      natsClient.send.mockReturnValue(of(mockListe));

      const result = await controller.findOne(mockListeId, mockRequest);

      expect(result).toEqual(mockListe);
      expect(natsClient.send).toHaveBeenCalledWith('list.findOne', {
        listeId: mockListeId,
        userId: mockUserId,
      });
    });

    it('should throw NotFoundException when list not found', async () => {
      natsClient.send.mockReturnValue(of(null));

      await expect(
        controller.findOne(mockListeId, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---- GET /lists/:id/films ----

  describe('getFilms', () => {
    it('should return films in a list', async () => {
      // Premier send = findOne (vérifier que la liste existe)
      // Deuxième send = getFilms
      natsClient.send
        .mockReturnValueOnce(of(mockListe))
        .mockReturnValueOnce(of([123, 456]));

      const result = await controller.getFilms(mockListeId, mockRequest);

      expect(result).toEqual({ listeId: mockListeId, films: [123, 456] });
    });

    it('should throw NotFoundException when list not found', async () => {
      // On vérifie que la liste existe avant de chercher les films
      natsClient.send.mockReturnValue(of(null));

      await expect(
        controller.getFilms(mockListeId, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---- POST /lists ----

  describe('create', () => {
    it('should create a new list with description', async () => {
      natsClient.send.mockReturnValue(of(mockListe));

      const result = await controller.create(
        { nom: 'Ma liste', description: 'Description' },
        mockRequest,
      );

      expect(result).toEqual(mockListe);
      expect(natsClient.send).toHaveBeenCalledWith('list.create', {
        userId: mockUserId,
        nom: 'Ma liste',
        description: 'Description',
      });
    });

    it('should create a new list without description', async () => {
      const listeWithoutDesc = { ...mockListe, description: null };
      natsClient.send.mockReturnValue(of(listeWithoutDesc));

      const result = await controller.create({ nom: 'Ma liste' }, mockRequest);

      expect(result).toEqual(listeWithoutDesc);
      expect(natsClient.send).toHaveBeenCalledWith('list.create', {
        userId: mockUserId,
        nom: 'Ma liste',
        description: undefined,
      });
    });

    it('should trim whitespace from nom and description', async () => {
      // Le controller doit nettoyer les espaces avant d'envoyer au service
      natsClient.send.mockReturnValue(of(mockListe));

      await controller.create(
        { nom: '  Ma liste  ', description: '  Description  ' },
        mockRequest,
      );

      expect(natsClient.send).toHaveBeenCalledWith('list.create', {
        userId: mockUserId,
        nom: 'Ma liste',
        description: 'Description',
      });
    });

    it('should throw BadRequestException when nom is empty', async () => {
      await expect(
        controller.create({ nom: '' }, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when nom is only whitespace', async () => {
      await expect(
        controller.create({ nom: '   ' }, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when nom is undefined', async () => {
      await expect(
        controller.create(
          { nom: undefined as unknown as string },
          mockRequest,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---- POST /lists/:id/films ----

  describe('addFilm', () => {
    it('should add a film to a list', async () => {
      natsClient.send.mockReturnValue(of(mockListeFilm));

      const result = await controller.addFilm(
        mockListeId,
        { tmdbId: mockTmdbId },
        mockRequest,
      );

      expect(result).toEqual({
        message: 'Film ajouté à la liste',
        ...mockListeFilm,
      });
      expect(natsClient.send).toHaveBeenCalledWith('list.addFilmToList', {
        listeId: mockListeId,
        tmdbId: mockTmdbId,
        userId: mockUserId,
      });
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
      // 0 est falsy en JS, donc le controller doit le rejeter
      await expect(
        controller.addFilm(mockListeId, { tmdbId: 0 }, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when list not found or access denied', async () => {
      // Le service retourne null si la liste n'existe pas ou n'appartient pas au user
      natsClient.send.mockReturnValue(of(null));

      await expect(
        controller.addFilm(mockListeId, { tmdbId: mockTmdbId }, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ---- PATCH /lists/:id ----

  describe('update', () => {
    it('should update a list name and description', async () => {
      const updatedListe = {
        ...mockListe,
        nom: 'Nouveau nom',
        description: 'Nouvelle desc',
      };
      natsClient.send.mockReturnValue(of(updatedListe));

      const result = await controller.update(
        mockListeId,
        { nom: 'Nouveau nom', description: 'Nouvelle desc' },
        mockRequest,
      );

      expect(result).toEqual(updatedListe);
      expect(natsClient.send).toHaveBeenCalledWith('list.update', {
        listeId: mockListeId,
        userId: mockUserId,
        nom: 'Nouveau nom',
        description: 'Nouvelle desc',
      });
    });

    it('should trim whitespace from nom and description', async () => {
      natsClient.send.mockReturnValue(of(mockListe));

      await controller.update(
        mockListeId,
        { nom: '  Nouveau nom  ', description: '  Desc  ' },
        mockRequest,
      );

      expect(natsClient.send).toHaveBeenCalledWith('list.update', {
        listeId: mockListeId,
        userId: mockUserId,
        nom: 'Nouveau nom',
        description: 'Desc',
      });
    });

    it('should throw BadRequestException when nom is empty', async () => {
      await expect(
        controller.update(mockListeId, { nom: '' }, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when nom is only whitespace', async () => {
      await expect(
        controller.update(mockListeId, { nom: '   ' }, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when list not found', async () => {
      natsClient.send.mockReturnValue(of(null));

      await expect(
        controller.update(mockListeId, { nom: 'Test' }, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---- DELETE /lists/:id ----

  describe('delete', () => {
    it('should delete a list', async () => {
      natsClient.send.mockReturnValue(of(true));

      // Le controller ne retourne rien (204 No Content)
      await expect(
        controller.delete(mockListeId, mockRequest),
      ).resolves.toBeUndefined();
      expect(natsClient.send).toHaveBeenCalledWith('list.delete', {
        listeId: mockListeId,
        userId: mockUserId,
      });
    });

    it('should throw NotFoundException when list not found', async () => {
      natsClient.send.mockReturnValue(of(false));

      await expect(
        controller.delete(mockListeId, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---- DELETE /lists/:id/films/:tmdbId ----

  describe('removeFilm', () => {
    it('should remove a film from a list', async () => {
      natsClient.send.mockReturnValue(of(true));

      await expect(
        controller.removeFilm(mockListeId, String(mockTmdbId), mockRequest),
      ).resolves.toBeUndefined();
      // Le tmdbId est parsé en number depuis le param string
      expect(natsClient.send).toHaveBeenCalledWith('list.removeFilmFromList', {
        listeId: mockListeId,
        tmdbId: mockTmdbId,
        userId: mockUserId,
      });
    });

    it('should throw NotFoundException when film or list not found', async () => {
      natsClient.send.mockReturnValue(of(false));

      await expect(
        controller.removeFilm(mockListeId, String(mockTmdbId), mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
