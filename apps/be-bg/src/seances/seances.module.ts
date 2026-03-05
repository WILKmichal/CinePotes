import { Module } from '@nestjs/common';
import { SeancesController } from './seances.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NATS_SERVICE',
        useFactory: () => ({
          transport: Transport.NATS,
          options: {
            servers: [process.env.NATS_URL!],
          },
        }),
      },
    ]),
  ],
  controllers: [SeancesController],
  providers: [AuthGuard],
})
export class SeancesModule {}
