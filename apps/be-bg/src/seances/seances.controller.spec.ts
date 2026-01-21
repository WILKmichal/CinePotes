import { Test, TestingModule } from '@nestjs/testing';
import { SeancesController } from './seances.controller';
import { SeancesService } from './seances.service';

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
});
