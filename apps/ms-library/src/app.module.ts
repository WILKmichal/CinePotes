import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestController } from './test.controller';
import { LibraryModule } from './services/ms-library/library.module';
import { RedisModule } from './services/redis/redis.module';

@Module({
  imports: [LibraryModule, RedisModule],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}
