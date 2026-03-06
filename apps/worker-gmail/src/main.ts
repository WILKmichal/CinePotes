import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { logStart, logError, logAction } from "@workspace/logger";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  logStart('worker-gmail', 'Worker started and listening to mail queue');

  process.on("SIGTERM", () => {
    logAction('worker-gmail', 'Received SIGTERM, shutting down gracefully');
    void app.close().then(() => process.exit(0));
  });
}

bootstrap().catch((err) => {
  logError('worker-gmail', 'Failed to start worker', undefined, err);
  process.exit(1);
});
