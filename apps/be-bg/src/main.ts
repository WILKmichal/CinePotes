import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Active la validation automatique des DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // Supprime les propriétés non définies dans le DTO
    forbidNonWhitelisted: true,  // Rejette la requête si des propriétés inconnues sont envoyées
    transform: true,        // Transforme automatiquement les types (ex: string -> number)
  }));

  // Autoriser le front sur plusieurs ports
  app.enableCors({
    origin: [
      'http://localhost:3000',
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
    const methods = Object.keys(document.paths[path]); // get methods like get, post, etc.
    for (const method of methods) {
      verbRouteLines.push(`${method.toUpperCase()} ${path}`);
    }
  }

  writeFileSync('./routes.txt', verbRouteLines.join('\n'));
  console.log('✅ Routes written to ./routes.txt');
  const port = Number(process.env.PORT ?? 3002); // support variable d'env
  await app.listen(port);

  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📖 Swagger available on http://localhost:${port}/api-docs`);
}

bootstrap();
