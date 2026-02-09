import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestController } from './test.controller';
import { TmdbModule } from './services/tmdb/tmdb.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from './users/users.module';
import { SeancesModule } from './seances/seances.module';
import { ListsModule } from './lists/lists.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Seance } from './seances/entities/seance.entity';
import { Participant } from './seances/entities/participant.entity';
import { Liste } from './lists/entities/liste.entity';
import { ListeFilm } from './lists/entities/liste-film.entity';
import { DataSource } from 'typeorm';

// DEBUG: vérifier les variables DB
console.log('DB_PASSWORD:', JSON.stringify(process.env.DB_PASSWORD));
console.log('DB_USER:', JSON.stringify(process.env.DB_USER));
console.log('DB_HOST:', JSON.stringify(process.env.DB_HOST));

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'example',
      database: process.env.DB_NAME || 'mydatabase',
      entities: [User, Seance, Participant, Liste, ListeFilm],
      synchronize: false,
    }),
    TmdbModule,
    AuthModule,
    UsersModule,
    SeancesModule,
    ListsModule,
  ],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {
  constructor(private readonly dataSource: DataSource) {}
}
