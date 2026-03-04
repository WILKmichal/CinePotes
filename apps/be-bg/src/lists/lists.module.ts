import { Module } from '@nestjs/common';
import { ListsController } from './lists.controller';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [NatsModule],
  controllers: [ListsController],
})
export class ListsModule {}
