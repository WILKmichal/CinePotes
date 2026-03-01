import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { validateEnvironmentVariables } from './config.validation';

async function bootstrap() {
  validateEnvironmentVariables();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL!],
      },
    },
  );

  await app.listen();
  console.log('ms-list connecte a NATS et en ecoute');
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
