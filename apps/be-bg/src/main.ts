import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { writeFileSync } from 'node:fs';
import { ConfigService } from '@nestjs/config';
import { logStart, logSuccess, logError } from '@workspace/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const natsUrl = configService.getOrThrow<string>('NATS_URL');
  const port = configService.getOrThrow<number>('APP_PORT');

  // Connecte be-bg à NATS en écoute pour recevoir des messages (@EventPattern)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [natsUrl],
    },
  });
  await app.startAllMicroservices();

  // Active la validation automatique des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Autoriser le front sur plusieurs ports
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3002',
    ],
    credentials: true,
  });

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('CinePotes API')
    .setDescription("Documentation de l'API CinePotes")
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('films')
    .addTag('Lists')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Generate VERB + route list
  const verbRouteLines: string[] = [];
  for (const path in document.paths) {
    const methods = Object.keys(document.paths[path]);
    for (const method of methods) {
      verbRouteLines.push(`${method.toUpperCase()} ${path}`);
    }
  }
  writeFileSync('./routes.txt', verbRouteLines.join('\n'));
  logSuccess('be-bg', 'Routes written to ./routes.txt');

  await app.listen(port);
  logStart('be-bg', `Backend running on http://localhost:${port}`);
  logStart('be-bg', `Swagger available on http://localhost:${port}/api-docs`);
}

bootstrap().catch((err) => {
  // Log startup errors and exit with failure
  logError('be-bg', 'Failed to start application', undefined, err);
  process.exit(1);
});
