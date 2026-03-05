import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const REQUIRED_DB_ENV_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
] as const;

function validateEnv() {
  const envPath = resolve(__dirname, '../.env');
  const dotenvResult = dotenv.config({ path: envPath });

  if (dotenvResult.error) {
    console.error(`✗ Unable to load environment file at ${envPath}`);
    console.error(dotenvResult.error.message);
    process.exit(1);
  }

  const missingVars = REQUIRED_DB_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return value === undefined || value.trim() === '';
  });

  if (missingVars.length > 0) {
    for (const key of missingVars) {
      console.error(`✗ Missing required env var: ${key}`);
    }
    process.exit(1);
  }

  const parsedEnv = dotenvResult.parsed ?? {};
  const unusedDbVars = Object.keys(parsedEnv).filter(
    (key) => key.startsWith('DB_') && !REQUIRED_DB_ENV_VARS.includes(key as (typeof REQUIRED_DB_ENV_VARS)[number]),
  );

  for (const key of unusedDbVars) {
    console.warn(`⚠ Env var ${key} is not needed by ms-schema and will be ignored`);
  }

  const parsedPort = Number.parseInt(process.env.DB_PORT!, 10);
  if (Number.isNaN(parsedPort) || parsedPort <= 0) {
    console.error('✗ Invalid DB_PORT: must be a positive integer');
    process.exit(1);
  }
}

validateEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('Starting database schema initialization...');

  // The AppModule.onModuleInit() will handle the exit
  await app.init();
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap:', error);
  process.exit(1);
});
