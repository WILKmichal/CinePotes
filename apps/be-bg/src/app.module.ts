import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestController } from './test.controller';
import { TmdbModule } from './services/tmdb/tmdb.module';

@Module({
  imports: [TmdbModule],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}
