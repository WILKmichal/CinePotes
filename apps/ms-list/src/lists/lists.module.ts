import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListsNatsController } from './lists.nats.controller';
import { ListsService } from './lists.service';
import { Liste } from './entities/liste.entity';
import { ListeFilm } from './entities/liste-film.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Liste, ListeFilm])],
  controllers: [ListsNatsController],
  providers: [ListsService],
})
export class ListsModule {}
