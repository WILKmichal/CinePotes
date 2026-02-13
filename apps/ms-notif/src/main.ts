import * as dotenv from "dotenv";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { validateEnvironmentVariables } from "./config.validation";

dotenv.config();

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
  console.log("ms-notif connecte a NATS et en ecoute");
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
