import { Module } from '@nestjs/common';
import { LibraryController } from './library.controllerGateway';
import { ConfigModule } from '@nestjs/config';
import { NatsModule } from '../../nats/nats.module';

@Module({
  imports: [
    NatsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [LibraryController],
  providers: [],
})
export class LibraryModule {}
