import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestController } from './test.controller';
import { TmdbModule } from './services/tmdb/tmdb.module';
import { AuthModule } from 'auth/auth.module';
import { UsersModule } from 'users/users.module';

@Module({
  imports: [TmdbModule, AuthModule, UsersModule],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}
