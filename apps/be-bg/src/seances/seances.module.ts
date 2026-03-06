import { Module } from '@nestjs/common';
import { SeancesController } from './seances.controller';
import { AuthModule } from '../auth/auth.module';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [NatsModule, AuthModule],
  controllers: [SeancesController],
})
export class SeancesModule {}
