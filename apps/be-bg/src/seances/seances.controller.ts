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
import { AuthGuard } from '@nestjs/passport';
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
@UseGuards(AuthGuard('jwt'))
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
}
