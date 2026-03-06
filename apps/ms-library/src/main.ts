import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { logStart, logError, logAction } from '@workspace/logger';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);
  const natsUrl = configService.getOrThrow<string>('NATS_URL');

  logAction('ms-library', `Connecting to NATS: ${natsUrl}`);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [natsUrl],
      },
    },
  );

  await app.listen();
  logStart('ms-library', 'Connected to NATS and listening for messages');
}

bootstrap().catch((err) => {
  logError('ms-library', 'Failed to start microservice', undefined, err);
  process.exit(1);
});
