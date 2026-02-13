import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { SeancesModule } from './seances/seances.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from 'schemas/participant.entity';
import { Seance } from 'schemas/seance.entity';
import { User } from 'schemas/user.entity';
import { Liste } from 'schemas/liste.entity';
import { ListeFilm } from 'schemas/liste-film.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT!, 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Seance, Participant, User, Liste, ListeFilm],
      synchronize: true,
    }),
    SeancesModule,
    // ClientsModule = permet à ms-exemple d'ENVOYER des messages via NATS
    // Sans ça, il peut seulement recevoir
    ClientsModule.register([
      {
        name: 'NATS_SERVICE', // token d'injection, on l'utilise avec @Inject('NATS_SERVICE')
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        },
      },
    ]),
  ],

  controllers: [AppController],
  providers: [],
})
export class AppModule {}
