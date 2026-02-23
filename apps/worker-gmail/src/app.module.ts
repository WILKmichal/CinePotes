import * as dotenv from "dotenv";
dotenv.config();

import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { MailProcessor } from "./mail.processor";

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
  providers: [MailProcessor],
})
export class AppModule {}
