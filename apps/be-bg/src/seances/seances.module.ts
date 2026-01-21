import { Module } from '@nestjs/common';
import { SeancesService } from './seances.service';
import { SeancesController } from './seances.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  controllers: [SeancesController],
  providers: [SeancesService],
  imports: [DatabaseModule],
})
export class SeancesModule {}
