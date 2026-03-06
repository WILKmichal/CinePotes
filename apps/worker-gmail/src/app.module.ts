import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailProcessor } from "./mail.processor";
import { HealthController } from "./health.controller";
import { envValidationSchema } from "./config.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["apps/worker-gmail/.env", ".env"],
      validationSchema: envValidationSchema,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>("REDIS_HOST"),
          port: configService.getOrThrow<number>("REDIS_PORT"),
        },
      }),
    }),
    BullModule.registerQueue({ name: "mail" }),
  ],
  controllers: [HealthController],
  providers: [MailProcessor],
})
export class AppModule {}
