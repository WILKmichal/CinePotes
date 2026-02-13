import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestController } from './test.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SeancesModule } from './seances/seances.module';
import { ListsModule } from './lists/lists.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Seance } from './seances/entities/seance.entity';
import { Participant } from './seances/entities/participant.entity';
import { Liste } from './lists/entities/liste.entity';
import { ListeFilm } from './lists/entities/liste-film.entity';
import { NatsExempleController } from './nats/nats-exemple.controller';
import { MailModule } from './mail/mail.module';
import { TmdbModule } from './services/library/library.module';
import { NatsModule } from './nats/nats.module';
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
    TmdbModule,
    AuthModule,
    UsersModule,
    SeancesModule,
    ListsModule,
    NatsModule,
    MailModule,
  ],
  controllers: [AppController, TestController, NatsExempleController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  }
}
