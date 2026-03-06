import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { NatsClientWrapper } from './nats-client-wrapper.service';

@Module({
  providers: [
    {
      provide: 'NATS_SERVICE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ClientProxyFactory.create({
          transport: Transport.NATS,
          options: {
            servers: [configService.getOrThrow<string>('NATS_URL')],
          },
        }),
    },
    NatsClientWrapper,
  ],
  exports: ['NATS_SERVICE', NatsClientWrapper],
})
export class NatsModule {}
