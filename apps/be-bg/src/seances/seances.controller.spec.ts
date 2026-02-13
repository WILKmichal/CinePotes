import { Test, TestingModule } from '@nestjs/testing';
import { SeancesController } from './seances.controller';
import { of } from 'rxjs';

// On crée un faux ClientProxy NATS pour les tests
// Au lieu de vraiment envoyer des messages à NATS, on simule les réponses
const mockNatsClient = {
  // send() retourne un Observable, donc on utilise of() pour simuler une réponse
  send: jest.fn(),
};

describe('SeancesController', () => {
  let controller: SeancesController;
  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeancesController],
      providers: [
        {
          // On injecte notre faux client NATS à la place du vrai
          provide: 'NATS_SERVICE',
          useValue: mockNatsClient,
        },
      ],
    }).compile();

    controller = module.get<SeancesController>(SeancesController);
    // On reset les mocks avant chaque test pour repartir de zéro
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('créer une séance', () => {
    it("devrait envoyer 'seances.create' via NATS avec le DTO et l'ID utilisateur", async () => {
      const createSeanceDto = {
        nom: 'Séance Test',
        date: new Date(),
        max_films: 5,
      };
      const result = {
        id: '1',
        nom: 'Séance Test',
        code: 'ABC123',
        statut: 'EN_ATTENTE',
        proprietaire_id: mockUserId,
      };

      // of(result) simule la réponse que ms-sessions renverrait via NATS
      mockNatsClient.send.mockReturnValue(of(result));

      const response = await controller.create(createSeanceDto, {
        user: { sub: mockUserId },
      });

      expect(response).toEqual(result);
      // On vérifie que le bon pattern NATS est appelé avec les bonnes données
      expect(mockNatsClient.send).toHaveBeenCalledWith('seances.create', {
        dto: createSeanceDto,
        userId: mockUserId,
      });
    });
  });

  describe('rejoindre une séance', () => {
    it("devrait envoyer 'seances.join' via NATS avec le code et l'ID utilisateur", async () => {
      const joinSeanceDto = { code: 'ABC123' };
      const result = {
        participant: { id: 'p1', seance_id: '1', utilisateur_id: mockUserId },
        seance: { id: '1', nom: 'Séance Test' },
      };

      mockNatsClient.send.mockReturnValue(of(result));

      const response = await controller.join(joinSeanceDto, {
        user: { sub: mockUserId },
      });

      expect(response).toEqual(result);
      expect(mockNatsClient.send).toHaveBeenCalledWith('seances.join', {
        code: 'ABC123',
        userId: mockUserId,
      });
    });
  });

  describe("récupérer les participants d'une séance", () => {
    it("devrait envoyer 'seances.participants' via NATS avec l'ID de séance", async () => {
      const seanceId = '1';
      const participants = [
        { id: 'p1', seance_id: seanceId, utilisateur_id: 'user-1' },
        { id: 'p2', seance_id: seanceId, utilisateur_id: 'user-2' },
      ];

      mockNatsClient.send.mockReturnValue(of(participants));

      const response = await controller.getParticipants(seanceId);

      expect(response).toEqual(participants);
      expect(mockNatsClient.send).toHaveBeenCalledWith('seances.participants', {
        seanceId,
      });
    });
  });

  describe("mettre à jour le statut d'une séance", () => {
    it("devrait envoyer 'seances.updateStatut' via NATS", async () => {
      const seanceId = '1';
      const updateStatutDto = { statut: 'TERMINEE' };
      const result = { id: seanceId, statut: 'TERMINEE' };

      mockNatsClient.send.mockReturnValue(of(result));

      const response = await controller.updateStatut(
        seanceId,
        updateStatutDto as any,
        { user: { sub: mockUserId } },
      );

      expect(response).toEqual(result);
      expect(mockNatsClient.send).toHaveBeenCalledWith('seances.updateStatut', {
        seanceId,
        userId: mockUserId,
        statut: 'TERMINEE',
      });
    });
  });

  describe("trouver la séance de l'utilisateur", () => {
    it("devrait envoyer 'seances.self' via NATS avec l'ID utilisateur", async () => {
      const seance = {
        id: '1',
        nom: 'Séance Test',
        proprietaire_id: mockUserId,
      };

      mockNatsClient.send.mockReturnValue(of(seance));

      const response = await controller.findMySeance({
        user: { sub: mockUserId },
      });

      expect(response).toEqual(seance);
      expect(mockNatsClient.send).toHaveBeenCalledWith('seances.self', {
        userId: mockUserId,
      });
    });

    it("devrait retourner null si aucune séance n'est trouvée", async () => {
      mockNatsClient.send.mockReturnValue(of(null));

      const response = await controller.findMySeance({
        user: { sub: mockUserId },
      });

      expect(response).toBeNull();
    });
  });

  describe('quitter la séance', () => {
    it("devrait envoyer 'seances.leave' via NATS", async () => {
      const seanceId = '1';
      const result = { message: 'Vous avez quitté la séance' };

      mockNatsClient.send.mockReturnValue(of(result));

      const response = await controller.leave(seanceId, {
        user: { sub: mockUserId },
      });

      expect(response).toEqual(result);
      expect(mockNatsClient.send).toHaveBeenCalledWith('seances.leave', {
        seanceId,
        userId: mockUserId,
      });
    });
  });
});
