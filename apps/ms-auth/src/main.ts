import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { validateEnvironmentVariables } from "./config.validation";

async function bootstrap() {
  // Validate environment variables before creating the app
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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen();
  console.log("🔐 ms-auth connecté à NATS et en écoute");
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
