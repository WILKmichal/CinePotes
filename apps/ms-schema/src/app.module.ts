import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from 'schemas/user.entity';
import { Seance } from 'schemas/seance.entity';
import { Participant } from 'schemas/participant.entity';
import { Liste } from 'schemas/liste.entity';
import { ListeFilm } from 'schemas/liste-film.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST!,
        port: Number.parseInt(process.env.DB_PORT!, 10),
        username: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        entities: [User, Seance, Participant, Liste, ListeFilm],
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
      // Create UUID extension
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✓ UUID extension created successfully');

      // Verify tables were created
      const tables = await this.dataSource.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      console.log(`✓ Database schema initialized with ${tables.length} tables`);

      console.log('Database initialization complete. Exiting...');
      process.exit(0);
    } catch (error) {
      console.error('✗ Failed to initialize database:', error);
      process.exit(1);
    }
  }
}
