import { Test, TestingModule } from '@nestjs/testing';
import { ListsNatsController } from './lists.nats.controller';
import { ListsService } from './lists.service';

// On mock le service pour tester uniquement le controller NATS
// Chaque @MessagePattern doit appeler la bonne methode du service avec les bons parametres

describe('ListsNatsController', () => {
  let controller: ListsNatsController;

  const mockService = {
    findAllByUser: jest.fn(),
    findAllByUserWithFilms: jest.fn(),
    findOne: jest.fn(),
    getFilmsInList: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addFilmToList: jest.fn(),
    removeFilmFromList: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListsNatsController],
      providers: [
        {
          provide: ListsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ListsNatsController>(ListsNatsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Recuperer les listes d'un utilisateur
  it('findAllByUser doit deleguer au service', async () => {
    const mockResult = [{ id: '1', nom: 'Liste 1' }];
    mockService.findAllByUser.mockResolvedValue(mockResult);

    const result = await controller.findAllByUser({ userId: 'user-123' });

    expect(result).toEqual(mockResult);
    expect(mockService.findAllByUser).toHaveBeenCalledWith('user-123');
  });

  // Recuperer les listes avec les films
  it('findAllByUserWithFilms doit deleguer au service', async () => {
    const mockResult = [{ id: '1', nom: 'Liste 1', films: [111, 222] }];
    mockService.findAllByUserWithFilms.mockResolvedValue(mockResult);

    const result = await controller.findAllByUserWithFilms({
      userId: 'user-123',
    });

    expect(result).toEqual(mockResult);
    expect(mockService.findAllByUserWithFilms).toHaveBeenCalledWith('user-123');
  });

  // Recuperer une liste par ID
  it('findOne doit deleguer au service avec listeId et userId', async () => {
    const mockResult = { id: 'liste-1', nom: 'Ma liste' };
    mockService.findOne.mockResolvedValue(mockResult);

    const result = await controller.findOne({
      listeId: 'liste-1',
      userId: 'user-123',
    });

    expect(result).toEqual(mockResult);
    expect(mockService.findOne).toHaveBeenCalledWith('liste-1', 'user-123');
  });

  // Recuperer les films d'une liste
  it('getFilmsInList doit deleguer au service', async () => {
    mockService.getFilmsInList.mockResolvedValue([111, 222]);

    const result = await controller.getFilmsInList({
      listeId: 'liste-1',
      userId: 'user-123',
    });

    expect(result).toEqual([111, 222]);
    expect(mockService.getFilmsInList).toHaveBeenCalledWith(
      'liste-1',
      'user-123',
    );
  });

  // Creer une liste
  it('create doit deleguer au service', async () => {
    const mockResult = { id: 'new-1', nom: 'Nouvelle liste' };
    mockService.create.mockResolvedValue(mockResult);

    const result = await controller.create({
      userId: 'user-123',
      nom: 'Nouvelle liste',
      description: 'Description',
    });

    expect(result).toEqual(mockResult);
    expect(mockService.create).toHaveBeenCalledWith(
      'user-123',
      'Nouvelle liste',
      'Description',
    );
  });

  // Modifier une liste
  it('update doit deleguer au service', async () => {
    const mockResult = { id: 'liste-1', nom: 'Nom modifie' };
    mockService.update.mockResolvedValue(mockResult);

    const result = await controller.update({
      listeId: 'liste-1',
      userId: 'user-123',
      nom: 'Nom modifie',
    });

    expect(result).toEqual(mockResult);
    expect(mockService.update).toHaveBeenCalledWith(
      'liste-1',
      'user-123',
      'Nom modifie',
      undefined,
    );
  });

  // Supprimer une liste
  it('delete doit deleguer au service', async () => {
    mockService.delete.mockResolvedValue(true);

    const result = await controller.delete({
      listeId: 'liste-1',
      userId: 'user-123',
    });

    expect(result).toBe(true);
    expect(mockService.delete).toHaveBeenCalledWith('liste-1', 'user-123');
  });

  // Ajouter un film a une liste
  it('addFilmToList doit deleguer au service', async () => {
    const mockResult = { liste_id: 'liste-1', tmdb_id: 999 };
    mockService.addFilmToList.mockResolvedValue(mockResult);

    const result = await controller.addFilmToList({
      listeId: 'liste-1',
      tmdbId: 999,
      userId: 'user-123',
    });

    expect(result).toEqual(mockResult);
    expect(mockService.addFilmToList).toHaveBeenCalledWith(
      'liste-1',
      999,
      'user-123',
    );
  });

  // Retirer un film d'une liste
  it('removeFilmFromList doit deleguer au service', async () => {
    mockService.removeFilmFromList.mockResolvedValue(true);

    const result = await controller.removeFilmFromList({
      listeId: 'liste-1',
      tmdbId: 999,
      userId: 'user-123',
    });

    expect(result).toBe(true);
    expect(mockService.removeFilmFromList).toHaveBeenCalledWith(
      'liste-1',
      999,
      'user-123',
    );
  });
});
