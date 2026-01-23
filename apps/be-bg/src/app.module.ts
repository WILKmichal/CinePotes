import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestController } from './test.controller';
import { TmdbModule } from './services/tmdb/tmdb.module';
import { AuthModule } from 'auth/auth.module';
import { UsersModule } from 'users/users.module';
import { ListsModule } from './lists/lists.module';

@Module({
  imports: [TmdbModule, AuthModule, UsersModule, ListsModule],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}
