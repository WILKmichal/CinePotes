import { Module } from '@nestjs/common';
import { SeancesController } from './seances.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        },
      },
    ]),
  ],
  controllers: [SeancesController],
  providers: [AuthGuard],
})
export class SeancesModule {}
