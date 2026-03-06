import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppController } from "./app.controller";
import { HealthController } from "./health.controller";
import { MailService } from "./mail.service";
import { envValidationSchema } from "./config.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["apps/ms-notif/.env", ".env"],
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
  controllers: [AppController, HealthController],
  providers: [MailService],
})
export class AppModule {}
