import { Controller } from '@nestjs/common';
import { SeancesService } from './seances/seances.service';
import { SeanceStatut } from 'schemas/seance.entity';
import {
  MessagePattern,
  Payload,
} from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly seancesService: SeancesService) {}

  @MessagePattern('seances.create')
  create(@Payload() data: { dto: { nom: string; date: Date; max_films: number }; userId: string }) {
    return this.seancesService.create(data.dto, data.userId);
  }

  @MessagePattern('seances.join')
  join(@Payload() data: { code: string; userId: string }) {
    return this.seancesService.join(data.code, data.userId);
  }

  @MessagePattern('seances.participants')
  getParticipants(@Payload() data: { seanceId: string }) {
    return this.seancesService.getParticipants(data.seanceId);
  }

  @MessagePattern('seances.updateStatut')
  updateStatut(@Payload() data: { seanceId: string; userId: string; statut: SeanceStatut }) {
    return this.seancesService.updateStatut(data.seanceId, data.userId, data.statut);
  }

  @MessagePattern('seances.self')
  findMySeance(@Payload() data: { userId: string }) {
    return this.seancesService.findByProprietaire(data.userId);
  }

  @MessagePattern('seances.leave')
  leave(@Payload() data: { seanceId: string; userId: string }) {
    return this.seancesService.leave(data.seanceId, data.userId);
  }
}

