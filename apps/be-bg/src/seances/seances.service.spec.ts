import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SeancesService } from './seances.service';
import { Seance, SeanceStatut } from './entities/seance.entity';
import { Participant } from './entities/participant.entity';

describe('SeancesService', () => {
  let service: SeancesService;
  let seanceRepository: jest.Mocked<Repository<Seance>>;
  let participantRepository: jest.Mocked<Repository<Participant>>;
 
  const mockSeanceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  const mockParticipantRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeancesService,
        {
          provide: getRepositoryToken(Seance),
          useValue: mockSeanceRepository,
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: mockParticipantRepository,
        },
      ],
    }).compile();

    service = module.get<SeancesService>(SeancesService);

    // Reset mocks avant chaque test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockCreateDto = {
      nom: 'Soirée cinéma test',
      date: new Date('2025-12-01'),
      max_films: 5,
    };
    const mockProprietaireId = '550e8400-e29b-41d4-a716-446655440000';

    it('doit créer une séance avec les bons champs', async () => {
      const mockSeance = {
        id: 'seance-id-123',
        ...mockCreateDto,
        proprietaire_id: mockProprietaireId,
        statut: SeanceStatut.EN_ATTENTE,
        code: 'ABC123',
        est_actif: true,
      };

      mockSeanceRepository.findOne.mockResolvedValue(null); // Pas de séance existante
      mockSeanceRepository.create.mockReturnValue(mockSeance);
      mockSeanceRepository.save.mockResolvedValue(mockSeance);

      const result = await service.create(mockCreateDto, mockProprietaireId);

      expect(result).toBeDefined();
      expect(result.nom).toBe(mockCreateDto.nom);
      expect(result.proprietaire_id).toBe(mockProprietaireId);
      expect(result.statut).toBe(SeanceStatut.EN_ATTENTE);
      expect(result.est_actif).toBe(true);
      expect(mockSeanceRepository.save).toHaveBeenCalled();
    });

    it('doit générer un code de 6 caractères', async () => {
      mockSeanceRepository.findOne.mockResolvedValue(null);
      mockSeanceRepository.create.mockImplementation((data) => data as Seance);
      mockSeanceRepository.save.mockImplementation((data) => Promise.resolve(data as Seance));

      const result = await service.create(mockCreateDto, mockProprietaireId);

      expect(result.code).toBeDefined();
      expect(result.code).toHaveLength(6);
      expect(result.code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('doit rejeter si le propriétaire a déjà une séance active', async () => {
      const existingSeance = { id: 'existing-id', est_actif: true };
      mockSeanceRepository.findOne.mockResolvedValue(existingSeance as Seance);

      await expect(service.create(mockCreateDto, mockProprietaireId))
        .rejects
        .toThrow(ConflictException);
    });
  });

  describe('join', () => {
    const mockCode = 'ABC123';
    const mockUtilisateurId = '550e8400-e29b-41d4-a716-446655440001';
    const mockSeance = {
      id: 'seance-id-123',
      code: mockCode,
      statut: SeanceStatut.EN_ATTENTE,
      est_actif: true,
    } as Seance;

    it('doit permettre à un utilisateur de rejoindre une séance', async () => {
      const mockParticipant = {
        id: 'participant-id-123',
        seance_id: mockSeance.id,
        utilisateur_id: mockUtilisateurId,
        a_rejoint_le: new Date(),
      };

      mockSeanceRepository.findOneBy.mockResolvedValue(mockSeance);
      mockParticipantRepository.findOneBy.mockResolvedValue(null); // Pas déjà participant
      mockParticipantRepository.create.mockReturnValue(mockParticipant as Participant);
      mockParticipantRepository.save.mockResolvedValue(mockParticipant as Participant);

      const result = await service.join(mockCode, mockUtilisateurId);

      expect(result).toBeDefined();
      expect(result.participant.utilisateur_id).toBe(mockUtilisateurId);
      expect(result.participant.seance_id).toBe(mockSeance.id);
      expect(result.seance.id).toBe(mockSeance.id);
    });

    it('doit rejeter si le code est invalide', async () => {
      mockSeanceRepository.findOneBy.mockResolvedValue(null);

      await expect(service.join('INVALID', mockUtilisateurId))
        .rejects
        .toThrow(NotFoundException);
    });

    it('doit rejeter si l\'utilisateur a déjà rejoint', async () => {
      const existingParticipant = { id: 'existing-participant' };
      mockSeanceRepository.findOneBy.mockResolvedValue(mockSeance);
      mockParticipantRepository.findOneBy.mockResolvedValue(existingParticipant as Participant);

      await expect(service.join(mockCode, mockUtilisateurId))
        .rejects
        .toThrow(ConflictException);
    });

    it('doit rejeter si la séance n\'est plus en attente', async () => {
      const seanceEnCours = { ...mockSeance, statut: SeanceStatut.EN_COURS };
      mockSeanceRepository.findOneBy.mockResolvedValue(seanceEnCours as Seance);

      await expect(service.join(mockCode, mockUtilisateurId))
        .rejects
        .toThrow(ConflictException);
    });
  });

  describe('findByProprietaire', () => {
    const mockProprietaireId = '550e8400-e29b-41d4-a716-446655440000';

    it('doit retourner la séance du propriétaire', async () => {
      const mockSeance = {
        id: 'seance-id-123',
        proprietaire_id: mockProprietaireId,
        est_actif: true,
      };
      mockSeanceRepository.findOne.mockResolvedValue(mockSeance as Seance);

      const result = await service.findByProprietaire(mockProprietaireId);

      expect(result).toBeDefined();
      expect(result?.proprietaire_id).toBe(mockProprietaireId);
    });

    it('doit retourner null si pas de séance', async () => {
      mockSeanceRepository.findOne.mockResolvedValue(null);

      const result = await service.findByProprietaire(mockProprietaireId);

      expect(result).toBeNull();
    });
  });

  describe('findByCode', () => {
    it('doit retourner la séance correspondant au code', async () => {
      const mockSeance = { id: 'seance-id', code: 'ABC123', est_actif: true };
      mockSeanceRepository.findOneBy.mockResolvedValue(mockSeance as Seance);

      const result = await service.findByCode('ABC123');

      expect(result).toBeDefined();
      expect(result.code).toBe('ABC123');
    });

    it('doit rejeter si le code n\'existe pas', async () => {
      mockSeanceRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findByCode('INVALID'))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('getParticipants', () => {
    it('doit retourner la liste des participants', async () => {
      const mockParticipants = [
        { id: 'p1', seance_id: 'seance-id', utilisateur_id: 'user-1' },
        { id: 'p2', seance_id: 'seance-id', utilisateur_id: 'user-2' },
      ];
      mockParticipantRepository.find.mockResolvedValue(mockParticipants as Participant[]);

      const result = await service.getParticipants('seance-id');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('doit retourner un tableau vide si pas de participants', async () => {
      mockParticipantRepository.find.mockResolvedValue([]);

      const result = await service.getParticipants('seance-id');

      expect(result).toEqual([]);
    });
  });

  describe('leave', () => {
    const mockSeanceId = 'seance-id-123';
    const mockUtilisateurId = 'user-id-123';

    it('doit permettre à un participant de quitter', async () => {
      mockParticipantRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.leave(mockSeanceId, mockUtilisateurId);

      expect(result.message).toBe('Vous avez quitté la séance');
    });

    it('doit rejeter si l\'utilisateur n\'est pas participant', async () => {
      mockParticipantRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(service.leave(mockSeanceId, mockUtilisateurId))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('updateStatut', () => {
    const mockSeanceId = 'seance-id-123';
    const mockProprietaireId = 'owner-id-123';

    it('doit mettre à jour le statut de la séance', async () => {
      const mockSeance = {
        id: mockSeanceId,
        proprietaire_id: mockProprietaireId,
        statut: SeanceStatut.EN_ATTENTE,
      };
      mockSeanceRepository.findOneBy.mockResolvedValue(mockSeance as Seance);
      mockSeanceRepository.save.mockResolvedValue({
        ...mockSeance,
        statut: SeanceStatut.EN_COURS,
      } as Seance);

      const result = await service.updateStatut(mockSeanceId, mockProprietaireId, SeanceStatut.EN_COURS);

      expect(result.statut).toBe(SeanceStatut.EN_COURS);
    });

    it('doit rejeter si la séance n\'existe pas ou n\'appartient pas au propriétaire', async () => {
      mockSeanceRepository.findOneBy.mockResolvedValue(null);

      await expect(service.updateStatut(mockSeanceId, mockProprietaireId, SeanceStatut.EN_COURS))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
