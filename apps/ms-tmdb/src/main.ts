import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });
  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('CinePotes API')
    .setDescription("Documentation de l'API CinePotes")
    .setVersion('1.0')
    .addTag('films')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = Number(process.env.PORT ?? 3333);
  await app.listen(port);
}
bootstrap();
