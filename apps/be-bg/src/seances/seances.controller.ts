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
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { CreateSeanceDto } from './dto/create-seance.dto';
import { JoinSeanceDto } from './dto/join-seance.dto';
import { UpdateStatutDto } from './dto/update-statut.dto';

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
@UseGuards(AuthGuard)
export class SeancesController {
  constructor(
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'Créer une nouvelle séance' })
  @Post()
  create(
    @Body() createSeanceDto: CreateSeanceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return firstValueFrom(
      this.natsClient.send('seances.create', {
        dto: createSeanceDto,
        userId: request.user.sub,
      }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Rejoindre une séance via son code' })
  @Post('join')
  join(
    @Body() joinSeanceDto: JoinSeanceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return firstValueFrom(
      this.natsClient.send('seances.join', {
        code: joinSeanceDto.code,
        userId: request.user.sub,
      }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: "Récupérer les participants d'une séance" })
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Get(':id/participants')
  getParticipants(@Param('id') id: string) {
    return firstValueFrom(
      this.natsClient.send('seances.participants', { seanceId: id }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: "Mettre à jour le statut d'une séance" })
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Patch(':id/statut')
  updateStatut(
    @Param('id') id: string,
    @Body() updateStatutDto: UpdateStatutDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return firstValueFrom(
      this.natsClient.send('seances.updateStatut', {
        seanceId: id,
        userId: request.user.sub,
        statut: updateStatutDto.statut,
      }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Récupérer mes séances' })
  @Get('self')
  findMySeance(@Req() req: AuthenticatedRequest) {
    return firstValueFrom(
      this.natsClient.send('seances.self', { userId: req.user.sub }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Quitter une séance' })
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Delete(':id/leave')
  leave(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return firstValueFrom(
      this.natsClient.send('seances.leave', {
        seanceId: id,
        userId: request.user.sub,
      }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Supprimer une séance (hôte uniquement)' })
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Delete(':id')
  deleteSeance(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return firstValueFrom(
      this.natsClient.send('seances.delete', {
        seanceId: id,
        userId: request.user.sub,
      }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Soumettre ses propositions de films' })
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Post(':id/propositions')
  submitPropositions(
    @Param('id') id: string,
    @Body() body: { tmdbIds: number[] },
    @Req() request: AuthenticatedRequest,
  ) {
    return firstValueFrom(
      this.natsClient.send('seances.propositions.submit', {
        seanceId: id,
        userId: request.user.sub,
        tmdbIds: body.tmdbIds,
      }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: "Récupérer toutes les propositions d'une séance" })
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Get(':id/propositions')
  getPropositions(@Param('id') id: string) {
    return firstValueFrom(
      this.natsClient.send('seances.propositions.get', { seanceId: id }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Vérifier si tous les participants ont soumis' })
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Get(':id/propositions/status')
  allSubmitted(@Param('id') id: string) {
    return firstValueFrom(
      this.natsClient.send('seances.propositions.allSubmitted', {
        seanceId: id,
      }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Soumettre son classement de films' })
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Post(':id/classement')
  submitClassement(
    @Param('id') id: string,
    @Body() body: { classement: { tmdb_id: number; rang: number }[] },
    @Req() request: AuthenticatedRequest,
  ) {
    return firstValueFrom(
      this.natsClient.send('seances.classement.submit', {
        seanceId: id,
        userId: request.user.sub,
        classement: body.classement,
      }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Vérifier si tous ont soumis leur classement' })
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Get(':id/classement/status')
  allClassementsSubmitted(@Param('id') id: string) {
    return firstValueFrom(
      this.natsClient.send('seances.classement.allSubmitted', { seanceId: id }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }

  @ApiOperation({ summary: 'Obtenir le résultat final (moyenne des rangs)' })
  @ApiParam({ name: 'id', description: 'ID de la séance (UUID)' })
  @Get(':id/classement/resultat')
  getResultatFinal(@Param('id') id: string) {
    return firstValueFrom(
      this.natsClient.send('seances.classement.resultat', { seanceId: id }),
    ).catch((err: RpcError) => {
      throw new HttpException(err.message, err.statusCode || 500);
    });
  }
}
