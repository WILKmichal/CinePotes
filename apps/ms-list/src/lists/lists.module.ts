import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListsNatsController } from './lists.nats.controller';
import { ListsService } from './lists.service';
import { Liste } from 'schemas/liste.entity';
import { ListeFilm } from 'schemas/liste-film.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Liste, ListeFilm])],
  controllers: [ListsNatsController],
  providers: [ListsService],
})
export class ListsModule {}
