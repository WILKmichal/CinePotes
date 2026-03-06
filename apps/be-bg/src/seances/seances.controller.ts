import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpException,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ParticipantGuard } from '../auth/participant.guard';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import {
  AllClassementsSubmittedPayload,
  AllParticipantsSubmittedPayload,
  CreateSeanceDto,
  CreateSeancePayload,
  DeleteSeancePayload,
  FindMySeancePayload,
  GetAllSessionsPayload,
  GetParticipantsPayload,
  GetPropositionsPayload,
  GetResultatFinalPayload,
  JoinSeanceDto,
  JoinSeancePayload,
  LeaveSeancePayload,
  SubmitClassementPayload,
  SubmitPropositionsPayload,
  UpdateStatutDto,
  UpdateStatutPayload,
} from '@workspace/dtos/seances';
import { NatsClientWrapper } from '../nats/nats-client-wrapper.service';

interface AuthenticatedRequest {
  user: { sub: string };
}

interface RpcError {
  message: string;
  statusCode: number;
}

@ApiTags('Seances')
@ApiBearerAuth()
@Controller('seances')
export class SeancesController {
  constructor(
    private readonly natsClient: NatsClientWrapper,
  ) {}

  @ApiOperation({ summary: 'Vérifier si un code de séance existe (public)' })
  @ApiParam({ name: 'code', description: 'Code de la séance (6 caractères)' })
  @Get('by-code/:code')
  checkCodeExists(@Param('code') code: string) {
    const payload = { code: code.toUpperCase() };
    return firstValueFrom(
      this.natsClient.send('seances.checkCode', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Créer une nouvelle séance' })
  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() createSeanceDto: CreateSeanceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const payload: CreateSeancePayload = {
      dto: createSeanceDto,
      userId: request.user.sub,
    };
    return firstValueFrom(
      this.natsClient.send('seances.create', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Rejoindre une séance via son code' })
  @UseGuards(AuthGuard)
  @Post('join')
  join(
    @Body() joinSeanceDto: JoinSeanceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const payload: JoinSeancePayload = {
      code: joinSeanceDto.code,
      userId: request.user.sub,
    };
    return firstValueFrom(
      this.natsClient.send('seances.join', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: "Récupérer les participants d'une séance" })
  @UseGuards(AuthGuard, ParticipantGuard)
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Get(':id/participants')
  getParticipants(@Param('id') id: string) {
    const payload: GetParticipantsPayload = { seanceId: id };
    return firstValueFrom(
      this.natsClient.send('seances.participants', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: "Mettre à jour le statut d'une séance" })
  @UseGuards(AuthGuard)
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Patch(':id/statut')
  updateStatut(
    @Param('id') id: string,
    @Body() updateStatutDto: UpdateStatutDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const payload: UpdateStatutPayload = {
      seanceId: id,
      userId: request.user.sub,
      statut: updateStatutDto.statut,
    };
    return firstValueFrom(
      this.natsClient.send('seances.updateStatut', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Récupérer mes séances' })
  @UseGuards(AuthGuard)
  @Get('self')
  findMySeance(@Req() req: AuthenticatedRequest) {
    const payload: FindMySeancePayload = { userId: req.user.sub };
    return firstValueFrom(
      this.natsClient.send('seances.self', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Récupérer toutes mes séances (owned + participated)' })
  @UseGuards(AuthGuard)
  @Get('self/all')
  findAllMySessions(@Req() req: AuthenticatedRequest) {
    const payload: GetAllSessionsPayload = { userId: req.user.sub };
    return firstValueFrom(
      this.natsClient.send('seances.self.all', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Quitter une séance' })
  @UseGuards(AuthGuard)
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Delete(':id/leave')
  leave(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const payload: LeaveSeancePayload = {
      seanceId: id,
      userId: request.user.sub,
    };
    return firstValueFrom(
      this.natsClient.send('seances.leave', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Supprimer une séance (hôte uniquement)' })
  @UseGuards(AuthGuard)
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Delete(':id')
  deleteSeance(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const payload: DeleteSeancePayload = {
      seanceId: id,
      userId: request.user.sub,
    };
    return firstValueFrom(
      this.natsClient.send('seances.delete', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Soumettre ses propositions de films' })
  @UseGuards(AuthGuard)
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Post(':id/propositions')
  submitPropositions(
    @Param('id') id: string,
    @Body() body: { tmdbIds: number[] },
    @Req() request: AuthenticatedRequest,
  ) {
    const payload: SubmitPropositionsPayload = {
      seanceId: id,
      userId: request.user.sub,
      tmdbIds: body.tmdbIds,
    };
    return firstValueFrom(
      this.natsClient.send('seances.propositions.submit', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: "Récupérer toutes les propositions d'une séance" })
  @UseGuards(AuthGuard, ParticipantGuard)
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Get(':id/propositions')
  getPropositions(@Param('id') id: string) {
    const payload: GetPropositionsPayload = { seanceId: id };
    return firstValueFrom(
      this.natsClient.send('seances.propositions.get', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Vérifier si tous les participants ont soumis' })
  @UseGuards(AuthGuard, ParticipantGuard)
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Get(':id/propositions/status')
  allSubmitted(@Param('id') id: string) {
    const payload: AllParticipantsSubmittedPayload = { seanceId: id };
    return firstValueFrom(
      this.natsClient.send('seances.propositions.allSubmitted', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Soumettre son classement de films' })
  @UseGuards(AuthGuard)
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Post(':id/classement')
  submitClassement(
    @Param('id') id: string,
    @Body() body: { classement: { tmdb_id: number; rang: number }[] },
    @Req() request: AuthenticatedRequest,
  ) {
    const payload: SubmitClassementPayload = {
      seanceId: id,
      userId: request.user.sub,
      classement: body.classement,
    };
    return firstValueFrom(
      this.natsClient.send('seances.classement.submit', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Vérifier si tous ont soumis leur classement' })
  @UseGuards(AuthGuard, ParticipantGuard)
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Get(':id/classement/status')
  allClassementsSubmitted(@Param('id') id: string) {
    const payload: AllClassementsSubmittedPayload = { seanceId: id };
    return firstValueFrom(
      this.natsClient.send('seances.classement.allSubmitted', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Obtenir le résultat final (moyenne des rangs)' })
  @UseGuards(AuthGuard, ParticipantGuard)
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Get(':id/classement/resultat')
  getResultatFinal(@Param('id') id: string) {
    const payload: GetResultatFinalPayload = { seanceId: id };
    return firstValueFrom(
      this.natsClient.send('seances.classement.resultat', payload),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }
}
