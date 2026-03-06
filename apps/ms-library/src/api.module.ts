import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: 'API_v1',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ClientProxyFactory.create({
          transport: Transport.NATS,
          options: {
            servers: [configService.getOrThrow<string>('NATS_URL')],
            headers: { 'x-version': '1.0.0' },
          },
        }),
    },
  ],
  exports: ['API_v1'],
})
export class ApiModule {}
