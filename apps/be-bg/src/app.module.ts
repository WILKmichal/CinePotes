import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestController } from './test.controller';
import { AuthModule } from './auth/auth.module';
import { SeancesModule } from './seances/seances.module';
import { ListsModule } from './lists/lists.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from 'schemas/user.entity';
import { Seance } from 'schemas/seance.entity';
import { Participant } from 'schemas/participant.entity';
import { Liste } from 'schemas/liste.entity';
import { ListeFilm } from 'schemas/liste-film.entity';
import { NatsModule } from './nats/nats.module';
import { NatsExempleController } from './nats/nats-exemple.controller';
import { MailModule } from './mail/mail.module';
import { LibraryModule } from './services/library/library.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
      ThrottlerModule.forRoot([{
        ttl: 60000,
        limit: 20,
      }]),
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
    LibraryModule,
    AuthModule,
    SeancesModule,
    ListsModule,
    NatsModule,
    MailModule,
  ],
  controllers: [AppController, TestController, NatsExempleController],
  providers: [  AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  }
}
