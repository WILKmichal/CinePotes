import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeancesController } from './seances.controller';
import { SeancesService } from './seances.service';
import { Seance } from './entities/seance.entity';
import { Participant } from './entities/participant.entity';

describe('SeancesController', () => {
  let controller: SeancesController;

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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('dois créer une séance', ()=> {
      //Arrange

      //Act

      //Assert
  });

  describe('dois rejoindre une séance', ()=> {
      //Arrange

      //Act

      //Assert
  });

  describe('dois récuperer les participants d\'une séance', ()=> {
      //Arrange

      //Act

      //Assert
  });

  describe('dois update le statut d\'une séance', ()=> {
      //Arrange

      //Act

      //Assert
  });

  describe('dois trouver la séance de l\'utilisateur', ()=> {
      //Arrange

      //Act

      //Assert
  });

  describe('dois quitter la séance', ()=> {
      //Arrange

      //Act

      //Assert
  });
});
