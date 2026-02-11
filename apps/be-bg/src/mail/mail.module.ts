import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailAdapter } from './mail.adapter';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [HttpModule, ConfigModule],
  providers: [MailAdapter],
  exports: [MailAdapter],
})
export class MailModule {}
