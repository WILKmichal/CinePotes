import * as dotenv from "dotenv";
dotenv.config();

import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AppController } from "./app.controller";
import { MailService } from "./mail.service";

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST!,
        port: Number(process.env.REDIS_PORT!),
      },
    }),
    BullModule.registerQueue({ name: "mail" }),
  ],
  controllers: [AppController],
  providers: [MailService],
})
export class AppModule {}
