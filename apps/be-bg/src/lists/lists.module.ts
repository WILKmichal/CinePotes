import { Module } from '@nestjs/common';
import { ListsController } from './lists.controller';
import { NatsModule } from '../nats/nats.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NatsModule, AuthModule],
  controllers: [ListsController],
})
export class ListsModule {}
