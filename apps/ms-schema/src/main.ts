import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { logStart, logError } from '@workspace/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  logStart('ms-schema', 'Starting database schema initialization...');

  // The AppModule.onModuleInit() will handle the exit
  await app.init();
}

bootstrap().catch((error) => {
  logError('ms-schema', 'Failed to bootstrap', undefined, error);
  process.exit(1);
});
