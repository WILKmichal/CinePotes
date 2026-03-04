import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeancesModule } from './seances.module';
import { SeancesService } from './seances.service';
import { Seance } from 'schemas/seance.entity';
import { Participant } from 'schemas/participant.entity';
import { PropositionFilm } from 'schemas/proposition-film.entity';
import { VoteClassement } from 'schemas/vote-classement.entity';

describe('SeancesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [SeancesModule],
    })
      .overrideProvider(getRepositoryToken(Seance))
      .useValue({ find: jest.fn(), findOne: jest.fn(), findOneBy: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn() })
      .overrideProvider(getRepositoryToken(Participant))
      .useValue({ find: jest.fn(), findOne: jest.fn(), findOneBy: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn(), count: jest.fn() })
      .overrideProvider(getRepositoryToken(PropositionFilm))
      .useValue({ find: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn(), count: jest.fn() })
      .overrideProvider(getRepositoryToken(VoteClassement))
      .useValue({ find: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn(), count: jest.fn() })
      .compile();
  });

  it('doit être défini', () => {
    expect(module).toBeDefined();
  });

  it('doit exposer SeancesService', () => {
    const service = module.get<SeancesService>(SeancesService);
    expect(service).toBeDefined();
  });
});
