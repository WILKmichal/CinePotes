import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeancesController } from './seances.controller';
import { SeancesService } from './seances.service';
import { Seance, SeanceStatut } from './entities/seance.entity';
import { Participant } from './entities/participant.entity';

describe('SeancesController', () => {
  let controller: SeancesController;
  let service: SeancesService;
  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeancesController],
      providers: [
        SeancesService,
        {
          provide: getRepositoryToken(Seance),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SeancesController>(SeancesController);
    service = module.get<SeancesService>(SeancesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('créer une séance', () => {
    it('devrait appeler le service.create avec le DTO et l\'ID utilisateur', async () => {
      const createSeanceDto = {
        nom: 'Séance Test',
        date: new Date(),
        max_films: 5,
      };
      const result = {
        id: '1',
        nom: 'Séance Test',
        date: new Date(),
        max_films: 5,
        code: 'ABC123',
        statut: SeanceStatut.EN_ATTENTE,
        proprietaire_id: mockUserId,
        created_at: new Date(),
        updated_at: new Date(),
        proprietaire: undefined,
        participants: [],
      } as any;

      jest.spyOn(service, 'create').mockResolvedValue(result);
      expect(await controller.create(createSeanceDto, { user: { sub: mockUserId } })).toBe(result);
      expect(service.create).toHaveBeenCalledWith(createSeanceDto, mockUserId);
    });
  });

  describe('rejoindre une séance', () => {
    it('devrait appeler le service.join avec le code et l\'ID utilisateur', async () => {
      const joinSeanceDto = { code: 'ABC123' };
      const result = {
        participant: {
          id: 'p1',
          seance_id: '1',
          utilisateur_id: mockUserId,
          a_rejoint_le: new Date(),
          seance: undefined,
          utilisateur: undefined,
        },
        seance: {
          id: '1',
          nom: 'Séance Test',
          date: new Date(),
          max_films: 5,
          code: 'ABC123',
          statut: SeanceStatut.EN_ATTENTE,
          proprietaire_id: 'other-user',
          created_at: new Date(),
          updated_at: new Date(),
          proprietaire: undefined,
          participants: [],
        },
      } as any;

      jest.spyOn(service, 'join').mockResolvedValue(result);
      expect(await controller.join(joinSeanceDto, { user: { sub: mockUserId } })).toBe(result);
      expect(service.join).toHaveBeenCalledWith(joinSeanceDto.code, mockUserId);
    });
  });

  describe('récupérer les participants d\'une séance', () => {
    it('devrait appeler le service.getParticipants avec l\'ID de séance', async () => {
      const seanceId = '1';
      const participants = [
        {
          id: 'p1',
          seance_id: seanceId,
          utilisateur_id: 'user-1',
          a_rejoint_le: new Date(),
          seance: undefined,
          utilisateur: undefined,
        },
        {
          id: 'p2',
          seance_id: seanceId,
          utilisateur_id: 'user-2',
          a_rejoint_le: new Date(),
          seance: undefined,
          utilisateur: undefined,
        },
      ] as any;

      jest.spyOn(service, 'getParticipants').mockResolvedValue(participants);
      expect(await controller.getParticipants(seanceId)).toBe(participants);
      expect(service.getParticipants).toHaveBeenCalledWith(seanceId);
    });
  });

  describe('mettre à jour le statut d\'une séance', () => {
    it('devrait appeler le service.updateStatut avec l\'ID séance, l\'ID utilisateur et le statut', async () => {
      const seanceId = '1';
      const updateStatutDto = { statut: SeanceStatut.TERMINEE };
      const result = {
        id: seanceId,
        nom: 'Séance Test',
        date: new Date(),
        max_films: 5,
        code: 'ABC123',
        statut: SeanceStatut.TERMINEE,
        proprietaire_id: mockUserId,
        created_at: new Date(),
        updated_at: new Date(),
        proprietaire: undefined,
        participants: [],
      } as any;

      jest.spyOn(service, 'updateStatut').mockResolvedValue(result);
      expect(await controller.updateStatut(seanceId, updateStatutDto, { user: { sub: mockUserId } })).toBe(result);
      expect(service.updateStatut).toHaveBeenCalledWith(seanceId, mockUserId, updateStatutDto.statut);
    });
  });

  describe('trouver la séance de l\'utilisateur', () => {
    it('devrait appeler le service.findByProprietaire avec l\'ID utilisateur', async () => {
      const seance = {
        id: '1',
        nom: 'Séance Test',
        date: new Date(),
        max_films: 5,
        code: 'ABC123',
        statut: SeanceStatut.EN_ATTENTE,
        proprietaire_id: mockUserId,
        created_at: new Date(),
        updated_at: new Date(),
        proprietaire: undefined,
        participants: [],
      } as any;

      jest.spyOn(service, 'findByProprietaire').mockResolvedValue(seance);
      expect(await controller.findMySeance({ user: { sub: mockUserId } })).toBe(seance);
      expect(service.findByProprietaire).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('quitter la séance', () => {
    it('devrait appeler le service.leave avec l\'ID séance et l\'ID utilisateur', async () => {
      const seanceId = '1';
      const result = { message: 'Séance quittée avec succès' };
      jest.spyOn(service, 'leave').mockResolvedValue(result);
      const response = await controller.leave(seanceId, { user: { sub: mockUserId } });
      expect(response).toEqual(result);
      expect(service.leave).toHaveBeenCalledWith(seanceId, mockUserId);
    });
  });
});

describe('SeancesController additional tests', () => {
  let controller: SeancesController;
  let service: SeancesService;
  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeancesController],
      providers: [
        SeancesService,
        {
          provide: getRepositoryToken(Seance),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SeancesController>(SeancesController);
    service = module.get<SeancesService>(SeancesService);
  });

  describe('create', () => {
    it('devrait retourner une erreur si le DTO est invalide', async () => {
      const invalidDto = {
        nom: '',
        date: new Date(),
        max_films: 0,
      };
      jest.spyOn(service, 'create').mockRejectedValue(new Error('Invalid DTO'));
      await expect(controller.create(invalidDto, { user: { sub: mockUserId } })).rejects.toThrow('Invalid DTO');
    });
  });

  describe('join', () => {
    it('devrait retourner une erreur si le code est invalide', async () => {
      jest.spyOn(service, 'join').mockRejectedValue(new Error('Code invalide'));
      await expect(controller.join({ code: '' }, { user: { sub: mockUserId } })).rejects.toThrow('Code invalide');
    });
  });

  describe('getParticipants', () => {
    it('devrait retourner une erreur si l\'ID de séance est invalide', async () => {
      jest.spyOn(service, 'getParticipants').mockRejectedValue(new Error('Séance non trouvée'));
      await expect(controller.getParticipants('invalid')).rejects.toThrow('Séance non trouvée');
    });
  });

  describe('updateStatut', () => {
    it('devrait retourner une erreur si le statut est invalide', async () => {
      jest.spyOn(service, 'updateStatut').mockRejectedValue(new Error('Statut invalide'));
      await expect(
        controller.updateStatut('1', { statut: SeanceStatut.EN_ATTENTE }, { user: { sub: mockUserId } })
      ).rejects.toThrow('Statut invalide');
    });
  });

  describe('findMySeance', () => {
    it('devrait retourner null si aucune séance n\'est trouvée', async () => {
      jest.spyOn(service, 'findByProprietaire').mockResolvedValue(null);
      expect(await controller.findMySeance({ user: { sub: mockUserId } })).toBeNull();
    });
  });

  describe('leave', () => {
    it('devrait retourner une erreur si l\'utilisateur n\'est pas participant', async () => {
      jest.spyOn(service, 'leave').mockRejectedValue(new Error('Utilisateur non participant'));
      await expect(controller.leave('1', { user: { sub: mockUserId } })).rejects.toThrow('Utilisateur non participant');
    });
  });
});