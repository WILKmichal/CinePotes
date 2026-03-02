import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

// TypeORM a besoin de TOUTES les entités liées par des relations,
// même si ms-auth n'écrit que dans User.
// (Même pattern que ms-sessions dans ce projet)
import { User } from 'schemas/user.entity';
import { Seance } from 'schemas/seance.entity';
import { Participant } from 'schemas/participant.entity';
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
      entities: [User, Seance, Participant, Liste, ListeFilm],
      synchronize: true,
    }),
    ClientsModule.register([
      {
        name: 'NATS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        },
      },
    ]),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
