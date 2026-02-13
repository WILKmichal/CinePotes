import { Module } from '@nestjs/common';
import { TmdbService } from './library.service';
import { RedisModule } from '../redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { TmdbNatsController } from './library.nats.controller';

@Module({
  imports: [
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [TmdbNatsController],
  providers: [TmdbService],
})
export class TmdbModule {}
