import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeancesService } from './seances.service';
import { Seance } from 'schemas/seance.entity';
import { Participant } from 'schemas/participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Seance, Participant])],
  providers: [SeancesService],
  exports: [SeancesService],
})
export class SeancesModule {}
