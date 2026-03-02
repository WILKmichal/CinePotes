import { Controller } from '@nestjs/common';
import { SeancesService } from './seances/seances.service';
import { SeanceStatut } from 'schemas/seance.entity';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly seancesService: SeancesService) {}

  @MessagePattern('seances.create')
  create(
    @Payload()
    data: {
      dto: { nom: string; date: Date; max_films: number };
      userId: string;
    },
  ) {
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
  updateStatut(
    @Payload() data: { seanceId: string; userId: string; statut: SeanceStatut },
  ) {
    return this.seancesService.updateStatut(
      data.seanceId,
      data.userId,
      data.statut,
    );
  }

  @MessagePattern('seances.self')
  findMySeance(@Payload() data: { userId: string }) {
    return this.seancesService.findActiveSeanceForUser(data.userId);
  }

  @MessagePattern('seances.leave')
  leave(@Payload() data: { seanceId: string; userId: string }) {
    return this.seancesService.leave(data.seanceId, data.userId);
  }

  @MessagePattern('seances.delete')
  deleteSeance(@Payload() data: { seanceId: string; userId: string }) {
    return this.seancesService.deleteSeance(data.seanceId, data.userId);
  }

  @MessagePattern('seances.propositions.submit')
  submitPropositions(
    @Payload() data: { seanceId: string; userId: string; tmdbIds: number[] },
  ) {
    return this.seancesService.submitPropositions(
      data.seanceId,
      data.userId,
      data.tmdbIds,
    );
  }

  @MessagePattern('seances.propositions.get')
  getPropositions(@Payload() data: { seanceId: string }) {
    return this.seancesService.getPropositions(data.seanceId);
  }

  @MessagePattern('seances.propositions.allSubmitted')
  allParticipantsSubmitted(@Payload() data: { seanceId: string }) {
    return this.seancesService.allParticipantsSubmitted(data.seanceId);
  }

  @MessagePattern('seances.classement.submit')
  submitClassement(
    @Payload()
    data: {
      seanceId: string;
      userId: string;
      classement: { tmdb_id: number; rang: number }[];
    },
  ) {
    return this.seancesService.submitClassement(
      data.seanceId,
      data.userId,
      data.classement,
    );
  }

  @MessagePattern('seances.classement.allSubmitted')
  allClassementsSubmitted(@Payload() data: { seanceId: string }) {
    return this.seancesService.allClassementsSubmitted(data.seanceId);
  }

  @MessagePattern('seances.classement.resultat')
  getResultatFinal(@Payload() data: { seanceId: string }) {
    return this.seancesService.getResultatFinal(data.seanceId);
  }
}
