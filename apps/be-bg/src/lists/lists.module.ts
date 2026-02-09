import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';
import { Liste } from './entities/liste.entity';
import { ListeFilm } from './entities/liste-film.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Liste, ListeFilm])],
  controllers: [ListsController],
  providers: [ListsService],
  exports: [ListsService],
})
export class ListsModule {}
