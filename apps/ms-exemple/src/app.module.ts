import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';

@Module({
  imports: [
    // ClientsModule = permet à ms-exemple d'ENVOYER des messages via NATS
    // Sans ça, il peut seulement recevoir
    ClientsModule.register([
      {
        name: 'NATS_SERVICE', // token d'injection, on l'utilise avec @Inject('NATS_SERVICE')
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
