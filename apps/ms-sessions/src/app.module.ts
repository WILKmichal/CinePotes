import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { SeancesModule } from './seances/seances.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from 'schemas/participant.entity';
import { Seance } from 'schemas/seance.entity';
import { User } from 'schemas/user.entity';
import { Liste } from 'schemas/liste.entity';
import { ListeFilm } from 'schemas/liste-film.entity';
import { PropositionFilm } from 'schemas/proposition-film.entity';
import { VoteClassement } from 'schemas/vote-classement.entity';
import { envValidationSchema } from './config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/ms-sessions/.env', '.env'],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: [
          Seance,
          Participant,
          User,
          Liste,
          ListeFilm,
          PropositionFilm,
          VoteClassement,
        ],
        synchronize: false,
      }),
    }),
    SeancesModule,
    // ClientsModule = permet à ms-exemple d'ENVOYER des messages via NATS
    // Sans ça, il peut seulement recevoir
    ClientsModule.registerAsync([
      {
        name: 'NATS_SERVICE', // token d'injection, on l'utilise avec @Inject('NATS_SERVICE')
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [configService.getOrThrow<string>('NATS_URL')],
          },
        }),
      },
    ]),
  ],

  controllers: [AppController, HealthController],
  providers: [],
})
export class AppModule {}
