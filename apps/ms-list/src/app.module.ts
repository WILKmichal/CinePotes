import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListsModule } from './lists/lists.module';
import { HealthController } from './health.controller';
import { Liste } from 'schemas/liste.entity';
import { ListeFilm } from 'schemas/liste-film.entity';
import { User } from 'schemas/user.entity';
import { Seance } from 'schemas/seance.entity';
import { Participant } from 'schemas/participant.entity';
import { envValidationSchema } from './config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/ms-list/.env', '.env'],
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
        entities: [Liste, ListeFilm, User, Seance, Participant],
        synchronize: false,
      }),
    }),
    ListsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
