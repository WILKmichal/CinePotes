import { Test, TestingModule } from '@nestjs/testing';
import { SeancesController } from './seances.controller';
import { SeancesService } from './seances.service';
import { create } from 'axios';

describe('SeancesController', () => {
  let controller: SeancesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeancesController],
      providers: [SeancesService],
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

  });

  describe('dois récuperer les participants d\'une séance', ()=> {

  });

  describe('dois update le statut d\'une séance', ()=> {

  });

  describe('dois trouver la séance de l\'utilisateur', ()=> {

  });

  describe('dois quitter la séance', ()=> {

  });
});
