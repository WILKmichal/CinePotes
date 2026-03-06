import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { RedisModule } from '../redis/redis.module';
import { LibraryNatsController } from './library.nats.controller';

@Module({
  imports: [RedisModule],
  controllers: [LibraryNatsController],
  providers: [LibraryService],
})
export class LibraryModule {}
