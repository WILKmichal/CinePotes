import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';

@ApiTags('NATS Exemple')
@Controller('nats-exemple')
export class NatsExempleController {
  constructor(
    // On injecte le client NATS pour pouvoir envoyer des messages
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  // ========== ENVOYER des messages ==========

  // GET /nats-exemple/hello?nom=Pierre
  // Envoie un EventPattern (fire-and-forget) à ms-exemple
  @Get('hello')
  @ApiOperation({ summary: 'Envoyer un message hello via NATS (fire-and-forget)' })
  @ApiQuery({ name: 'nom', required: false, example: 'Pierre' })
  @ApiResponse({ status: 200, description: 'Message envoyé au broker' })
  testHello(@Query('nom') nom: string) {
    this.natsClient.emit('exemple.hello', { nom: nom ?? 'Anonyme' });
    return { message: `Message envoye via NATS pour ${nom}` };
  }

  // GET /nats-exemple/greet?nom=Pierre
  // Envoie un MessagePattern (request-response) à ms-exemple et attend la réponse
  @Get('greet')
  @ApiOperation({ summary: 'Envoyer un message greet via NATS (request-response)' })
  @ApiQuery({ name: 'nom', required: false, example: 'Pierre' })
  @ApiResponse({ status: 200, description: 'Reponse recue de ms-exemple' })
  async testGreet(@Query('nom') nom: string) {
    // send() retourne un Observable, firstValueFrom le convertit en Promise
    const reponse = await firstValueFrom(
      this.natsClient.send('exemple.greet', { nom: nom ?? 'Anonyme' }),
    );
    return { reponse };
  }

  // GET /nats-exemple/process?taskId=123
  // Envoie un event 'exemple.process' à ms-exemple
  // ms-exemple va le traiter puis envoyer 'exemple.done' que be-bg recoit ci-dessous
  @Get('process')
  @ApiOperation({ summary: 'Envoyer une tache a traiter via NATS (aller-retour)' })
  @ApiQuery({ name: 'taskId', required: false, example: '123' })
  @ApiResponse({ status: 200, description: 'Tache envoyee au broker' })
  testProcess(@Query('taskId') taskId: string) {
    this.natsClient.emit('exemple.process', { taskId: taskId ?? '1' });
    return { message: `Tache ${taskId} envoyee au broker` };
  }

  // ========== RECEVOIR des messages ==========

  // be-bg ecoute 'exemple.done' que ms-exemple envoie apres avoir traite une tache
  @EventPattern('exemple.done')
  handleDone(@Payload() data: { taskId: string; status: string }) {
    console.log(`Tache ${data.taskId} terminee avec le status : ${data.status}`);
  }
}
