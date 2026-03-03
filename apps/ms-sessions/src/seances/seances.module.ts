import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeancesService } from './seances.service';
import { Seance } from 'schemas/seance.entity';
import { Participant } from 'schemas/participant.entity';
import { PropositionFilm } from 'schemas/proposition-film.entity';
import { VoteClassement } from 'schemas/vote-classement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Seance,
      Participant,
      PropositionFilm,
      VoteClassement,
    ]),
  ],
  providers: [SeancesService],
  exports: [SeancesService],
})
export class SeancesModule {}
