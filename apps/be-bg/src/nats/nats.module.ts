import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    // ClientsModule = permet à be-bg d'ENVOYER des messages via NATS
    // Sans ça, il peut seulement recevoir
    ClientsModule.register([
      {
        name: 'NATS_SERVICE', // token d'injection, on l'utilise avec @Inject('NATS_SERVICE')
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL!],
        },
      },
    ]),
  ],
  exports: [ClientsModule], // on exporte pour que les autres modules de be-bg puissent l'utiliser
})
export class NatsModule {}
