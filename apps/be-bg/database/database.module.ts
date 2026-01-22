import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export const PG_POOL = 'PG_POOL';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: async () => {
        const pool = new Pool({
          host: process.env.DB_HOST || '127.0.0.1', // 🔥 forcer IPv4
          port: Number(process.env.DB_PORT || 5432),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'example',
          database: process.env.DB_NAME || 'mydatabase',
          ssl: false, // IMPORTANT en local
        });

        // 🔥 Test immédiat de connexion (FAIL FAST)
        await pool.query('SELECT 1');

        console.log('✅ PostgreSQL connecté');

        return pool;
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
