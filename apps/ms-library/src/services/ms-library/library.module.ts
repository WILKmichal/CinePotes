import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { RedisModule } from '../redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { LibraryNatsController } from './library.nats.controller';

@Module({
  imports: [
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [LibraryNatsController],
  providers: [LibraryService],
})
export class LibraryModule {}
