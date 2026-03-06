import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from 'schemas/user.entity';
import { Seance } from 'schemas/seance.entity';
import { Participant } from 'schemas/participant.entity';
import { Liste } from 'schemas/liste.entity';
import { ListeFilm } from 'schemas/liste-film.entity';
import { PropositionFilm } from 'schemas/proposition-film.entity';
import { VoteClassement } from 'schemas/vote-classement.entity';
import { envValidationSchema } from './config.validation';
import { logAction, logSuccess, logError } from '@workspace/logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/ms-schema/.env', '.env'],
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
        entities: [User, Seance, Participant, Liste, ListeFilm, PropositionFilm, VoteClassement],
        synchronize: true,
        logging: ['error', 'warn', 'info'],
      }),
    }),
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      // Create UUID extension (raw SQL required for PostgreSQL extensions)
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      logSuccess('ms-schema', 'UUID extension created successfully');

      // Verify tables were created using TypeORM metadata
      const entityMetadatas = this.dataSource.entityMetadatas;
      const tableCount = entityMetadatas.filter(metadata => metadata.tableType === 'regular').length;
      logSuccess('ms-schema', `Database schema initialized with ${tableCount} tables`);

      logSuccess('ms-schema', 'Database initialization complete. Exiting...');
      process.exit(0);
    } catch (error) {
      logError('ms-schema', 'Failed to initialize database', undefined, error);
      process.exit(1);
    }
  }
}
