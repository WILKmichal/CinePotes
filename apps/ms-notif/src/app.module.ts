import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MailService } from './mail.service';

@Module({
  controllers: [AppController],
  providers: [MailService],
})
export class AppModule {}
