import * as dotenv from 'dotenv';
dotenv.config();

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListsModule } from './lists/lists.module';
import { Liste } from './lists/entities/liste.entity';
import { ListeFilm } from './lists/entities/liste-film.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT!, 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Liste, ListeFilm],
      synchronize: true,
    }),
    ListsModule,
  ],
})
export class AppModule {}
