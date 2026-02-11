import { Controller, Inject } from '@nestjs/common';
import {
  ClientProxy,
  EventPattern,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(
    // On injecte le client NATS pour pouvoir ENVOYER des messages
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  // ========== RECEVOIR des messages ==========

  // EventPattern = fire-and-forget (be-bg envoie, ms-exemple traite, pas de réponse)
  // be-bg fait : natsClient.emit('exemple.hello', { nom: 'Pierre' })
  @EventPattern('exemple.hello')
  handleHello(@Payload() data: { nom: string }) {
    console.log(`Hello recu de : ${data.nom}`);
  }

  // MessagePattern = request-response (be-bg envoie et attend une réponse)
  // be-bg fait : natsClient.send('exemple.greet', { nom: 'Pierre' })
  @MessagePattern('exemple.greet')
  handleGreet(@Payload() data: { nom: string }): string {
    return `Bonjour ${data.nom}, bienvenue sur CinePotes !`;
  }

  // ========== ENVOYER des messages ==========

  // EventPattern qui recoit un message, puis en envoie un autre au broker
  // Ici ms-exemple recoit 'exemple.process' et notifie be-bg via 'exemple.done'
  @EventPattern('exemple.process')
  handleProcess(@Payload() data: { taskId: string }) {
    console.log(`Traitement de la tache : ${data.taskId}`);

    // emit = envoyer un message au broker (fire-and-forget)
    // N'importe quel service qui ecoute 'exemple.done' le recevra
    this.natsClient.emit('exemple.done', {
      taskId: data.taskId,
      status: 'completed',
    });
  }
}
