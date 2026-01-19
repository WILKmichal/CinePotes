import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Autoriser le front sur le port 3000
  app.enableCors({ origin: 'http://localhost:3000', credentials: true });

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('CinePotes API')
    .setDescription("Documentation de l'API CinePotes")
    .setVersion('1.0')
    .addTag('films')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = 3002; // backend sur 3002
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📖 Swagger available on http://localhost:${port}/api-docs`);
}
bootstrap();
