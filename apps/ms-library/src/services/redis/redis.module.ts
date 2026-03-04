import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Module({
  providers: [RedisService],
  // L export pour qu il soit utilisable dans d autres modules
  exports: [RedisService],
})
export class RedisModule {}
