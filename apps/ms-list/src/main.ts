import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { logStart, logError } from '@workspace/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [configService.getOrThrow<string>('NATS_URL')],
    },
  });

  await app.startAllMicroservices();
  logStart('ms-list', 'Connected to NATS and listening for messages');
}

bootstrap().catch((err: unknown) => {
  logError('ms-list', 'Failed to start microservice', undefined, err);
  process.exit(1);
});
