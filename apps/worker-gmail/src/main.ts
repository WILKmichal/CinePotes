import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateEnvironmentVariables } from './config.validation';

async function bootstrap() {
  validateEnvironmentVariables();

  const app = await NestFactory.createApplicationContext(AppModule);

  console.log('worker-gmail demarre et ecoute la queue mail');

  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
