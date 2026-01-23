import { Test, TestingModule } from '@nestjs/testing';
import { SeancesService } from './seances.service';
import { CreateSeanceDto } from './dto/create-seance.dto';
import { Seance } from './entities/seance.entity';
import { DatabaseModule, PG_POOL } from '../../database/database.module';
import { Pool } from 'pg';

describe('SeancesService', () => {
  let service: SeancesService;
  let pool: Pool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [SeancesService],
    }).compile();

    service = module.get<SeancesService>(SeancesService);
    pool = module.get<Pool>(PG_POOL);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // //Test de la géneration du code d'une séance
  // describe('dois generer un code de 6 caracteres', () => {
  //     it('dois retourner une chaine de caracteres', async ()=> {
  //       const result = service.generateCode();
  //       expect(typeof result).toBe('string');
  //     });
  //     it('dois génerer une chaine de 6 de length max', async ()=>{
  //       const result = service.generateCode();
  //       expect(result).toHaveLength(6);
  //     });
  //     it('dois respecter le format exigé : LETTRES MAJUSCULES et CHIFFRES', async ()=> {
  //       const result = service.generateCode();
  //       //regex explanation :
  //       //^ start of string
  //       //[A-Z0-9] any uppercase letter or digit
  //       //{6} exactly 6 times
  //       //$ end of string
  //       expect(result).toMatch(/^[A-Z0-9]{6}$/);
  //     });
  //   });

    describe('dois créer une seance', () => {

      let mockCreateSeanceDto: CreateSeanceDto;
      let mockProprietaireId: string;

      beforeEach(async () =>{
        mockCreateSeanceDto = {
          nom: 'Soirée cinema test',
          date: new Date ('2025-11-11'),
          max_films: 5
        };
        mockProprietaireId = '550e8400-e29b-41d4-a716-446655440000';
      });

      it('dois créer une séance avec les bons champs',async ()=> {

        const result = await service.create(mockCreateSeanceDto, mockProprietaireId);
        //Vérifier si la fonction retourne quelque chose
        expect(result).toBeDefined();

        expect(result.nom).toBe(mockCreateSeanceDto.nom);
        expect(new Date(result.date)).toEqual(mockCreateSeanceDto.date);
        expect(result.max_films).toBe(mockCreateSeanceDto.max_films);
        expect(result.est_actif).toBe(true);

        expect(result.proprietaire_id).toBe(mockProprietaireId);
      });

      it('la séance contient bien un code de 6 caracteres', async ()=> {
        
        const result = await service.create( mockCreateSeanceDto, mockProprietaireId);

        expect(result.code).toHaveLength(6);
        expect(result.code).toMatch(/^[A-Z0-9]{6}$/);
        expect(result.code).toBeDefined();
      });

      it('l\'id du chef est bien celui du proprietaire_id en parametres', async ()=> {
        const result = await service.create( mockCreateSeanceDto, mockProprietaireId);

        expect(result.proprietaire_id).toBe(mockProprietaireId);
      });

      it('tous les champs obligatoires sont remplis', async ()=> {
        const result = await service.create( mockCreateSeanceDto, mockProprietaireId);

        expect(result.nom).toBeDefined();
        expect(result.date).toBeDefined();
        expect(result.max_films).toBeDefined();
        expect(result.code).toBeDefined();
        expect(result.proprietaire_id).toBeDefined();
      });
      //CAS ERREUR
      it('dois retourner une erreur si le user est vide ou null', async ()=> {
        //A FAIRE PLUS TARD
      });

      it('dois retourner une erreur si le user n\'existe pas', async ()=> {
      //A FAIRE  PLUS TARD
      });

      it('dois retourner une erreur si plusieurs séances ont un meme user en tant que proprietaire', async ()=>{
      //A FAIRE PLUS TARD
      });
    });

    describe('dois rejoindre une séance', () => {
      let mockCode: string;
      let mockUtilisateurId: string;
      let mockCreatedSeance : Seance;

      beforeEach(async () =>{
        const mockDto = {
          nom: 'Séance test',
          date: new Date('2025-12-01'),
          max_films: 5
        };
        const proprietaireId = '550e8400-e29b-41d4-a716-446655440000';
        mockCreatedSeance = await service.create(mockDto, proprietaireId);
        mockCode = mockCreatedSeance.code;
        mockUtilisateurId = '550e8400-e29b-41d4-a716-446655440001';
      });

      it('dois permettre a un user de rejoindre une séance', async ()=> {
        const result = await service.join( mockCode, mockUtilisateurId);

        expect (result).toBeDefined();
      });

      it('dois vérifier si le participant ajouté a bien les bonnes informations', async ()=>{
        const result = await service.join( mockCode, mockUtilisateurId);

        expect (result.participant.utilisateur_id).toBe(mockUtilisateurId);
        expect (result.participant.seance_id).toBe(mockCreatedSeance.id);
        expect (result.participant.a_rejoint_le).toBeDefined();
      });

      it('vérifie que la réponse contient bien la séance et le participant', async ()=>{
        const result = await service.join( mockCode, mockUtilisateurId);

        expect (result.seance.id).toBe(mockCreatedSeance.id);
        expect (result.seance.code).toBe(mockCode);

        expect (result.participant.utilisateur_id).toBe(mockUtilisateurId);
        expect (result.participant.seance_id).toBe(mockCreatedSeance.id);
      });
      //CAS ERREUR
      it('dois retourner une erreur si le code n\'est pas bon', async ()=>{
        //A FAIRE PLUS TARD
      });

      it('dois retourner une erreur si l\'utilisateur a deja rejoint', async ()=>{
        //A FAIRE PLUS TARD
      });
    });

    describe('dois récuperer une séance créer par le proprietaire', () => {
      let mockProprietaireId: string;
      let mockCreatedSeance : Seance;

      beforeEach(async () =>{
        mockProprietaireId = '550e8400-e29b-41d4-a716-446655440000';
        const mockDto :  CreateSeanceDto = {
          nom: 'Séance test',
          date: new Date('2025-12-01'),
          max_films: 5
        };
        mockCreatedSeance = await service.create(mockDto, mockProprietaireId);
      });

      it('dois retourner la séance créer par le proprio', async()=>{
        const result = await service.findByProprietaire(mockProprietaireId);
        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        expect(result!.id).toBe(mockCreatedSeance.id);
        expect(result!.proprietaire_id).toBe(mockProprietaireId);
      });

      it('la séance retourné contient tout les champs', async() => {
        const result = await service.findByProprietaire(mockProprietaireId);
        expect(result).not.toBeNull();
        expect(result!.nom).toBe(mockCreatedSeance.nom);
        expect(result!.code).toBeDefined();
        expect(result!.statut).toBe('en_attente');
        expect(result!.est_actif).toBe(true);
      });

      it('dois retourner null si le proprietaire n\'a pas de séance', async() => {
        const newUserId = '550e8400-e29b-41d4-a716-446655440099';
        const result = await service.findByProprietaire(newUserId);
        expect(result).toBeNull();
      });

      it('ne peut pas créer une deuxième séance si une est déjà active', async() => {
        const mockDto2: CreateSeanceDto = {
        nom: 'Séance test 2',
        date: new Date('2025-12-15'),
        max_films: 3
      };
      await expect(service.create(mockDto2, mockProprietaireId))
      .rejects
      .toThrow('Vous avez déjà une séance active');
      });
    });

    //TEST GET SEANCE WITH CODE
    describe('dois récuperer une séance avec son code', ()=> {
      let mockCode: string;
      let mockCreatedSeance : Seance;

      beforeEach(async () =>{
        const mockDto = {
          nom: 'Séance test',
          date: new Date('2025-12-01'),
          max_films: 5
        };
        const proprietaireId = '550e8400-e29b-41d4-a716-446655440000';
        mockCreatedSeance = await service.create(mockDto, proprietaireId);
        mockCode = mockCreatedSeance.code;
      });

      it('la séance ne dois pas etre null',async ()=> {
        const result = await service.findByCode(mockCode);

        expect(result).toBeDefined();
        expect(result.code).toBe(mockCode);
        expect(result.code).toHaveLength(6);
      });
    });

    describe('dois récuperer les participants d\'une séance', ()=> {
      let mockSeanceId:string;
      let mockCreatedSeance: Seance;
      let mockParticipant1: string;
      let mockParticipant2: string;
      let mockParticipant3: string;
      beforeEach(async ()=>{
        const mockDto: CreateSeanceDto = {
          nom: 'Séance test participants',
          date: new Date('2025-12-01'),
          max_films: 5
        }
      const proprietaireId = '550e8400-e29b-41d4-a716-446655440000';
      mockCreatedSeance = await service.create(mockDto, proprietaireId);
      mockSeanceId = mockCreatedSeance.id;

      mockParticipant1 = '550e8400-e29b-41d4-a716-446655440001';
      mockParticipant2 = '550e8400-e29b-41d4-a716-446655440002';
      mockParticipant3 = '550e8400-e29b-41d4-a716-446655440003';

      await service.join(mockCreatedSeance.code, mockParticipant1);
      await service.join(mockCreatedSeance.code, mockParticipant2);
      await service.join(mockCreatedSeance.code, mockParticipant3);

      });
      it('dois retourner la liste des participants de la séance', async () => {
        const result = await service.getParticipants(mockSeanceId);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(3); // 3 participants
      });

      it('chaque participant contient les bonnes informations', async () => {
        const result = await service.getParticipants(mockSeanceId);
        // Vérifier le premier participant
        const participant1 = result.find(p => p.utilisateur_id === mockParticipant1);
        expect(participant1).toBeDefined();
        expect(participant1!.seance_id).toBe(mockSeanceId);
        expect(participant1!.a_rejoint_le).toBeDefined();
      });

      it('tous les participants appartiennent à la même séance', async () => {
        const result = await service.getParticipants(mockSeanceId);

        result.forEach(participant => {
          expect(participant.seance_id).toBe(mockSeanceId);
        });
      });

    });

    describe('dois quitter une séance', ()=> {
      let mockSeanceId:string;
      let mockCreatedSeance: Seance;
      let mockUtilisateurId: string;
      //Creation d'un seance
      beforeEach(async ()=>{
        const mockDto = {
          nom: 'Séance test delete',
          date: new Date('2025-12-01'),
          max_films: 5
        };
        const proprietaireId = '550e8400-e29b-41d4-a716-446655440000';
        mockCreatedSeance = await service.create(mockDto, proprietaireId);
        mockSeanceId = mockCreatedSeance.id;

        mockUtilisateurId = '550e8400-e29b-41d4-a716-446655440001';

      //Ajout d'un utilisateur
        await service.join(mockCreatedSeance.code,mockUtilisateurId);
      })

      it('dois permettre à un participant de quitter la séance', async () => {
        const result = await service.leave(mockSeanceId, mockUtilisateurId);
        expect(result).toBeDefined();
        expect(result.message).toBe('Vous avez quitté la séance');
      });

      it('le participant ne doit plus être dans la liste après avoir quitté', async () => {
         // Quitter la séance
        await service.leave(mockSeanceId, mockUtilisateurId);

        // Vérifier qu'il n'est plus dans la liste
        const participants = await service.getParticipants(mockSeanceId);
        const participantTrouve = participants.find(p => p.utilisateur_id === mockUtilisateurId);

        expect(participantTrouve).toBeUndefined();
      });
    });
  });
