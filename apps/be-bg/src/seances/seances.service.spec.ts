import { Test, TestingModule } from '@nestjs/testing';
import { SeancesService } from './seances.service';

describe('SeancesService', () => {
  let service: SeancesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeancesService],
    }).compile();

    service = module.get<SeancesService>(SeancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
