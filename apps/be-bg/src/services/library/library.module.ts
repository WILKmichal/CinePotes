import { Module } from '@nestjs/common';
import { TmdbController } from './library.controllerGateway';
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
  controllers: [TmdbController],
  providers: [],
})
export class TmdbModule {}
