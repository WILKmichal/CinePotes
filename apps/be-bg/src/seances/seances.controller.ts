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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SeancesService } from './seances.service';

interface AuthenticatedRequest {
  user: { sub: string };
}
import { CreateSeanceDto } from './dto/create-seance.dto';
import { JoinSeanceDto } from './dto/join-seance.dto';
import { UpdateStatutDto } from './dto/update-statut.dto';

@Controller('seances')
@UseGuards(AuthGuard('jwt'))
export class SeancesController {
  constructor(private readonly seancesService: SeancesService) {}

  //POST /seances - Crée une nouvelle séance
  @Post()
  create(
    @Body() createSeanceDto: CreateSeanceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = request.user.sub; // Récupère l'ID utilisateur depuis le JWT
    return this.seancesService.create(createSeanceDto, userId);
  }

  //POST /seances/join - Rejoindre une séance via son code
  @Post('join')
  join(
    @Body() joinSeanceDto: JoinSeanceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = request.user.sub;
    return this.seancesService.join(joinSeanceDto.code, userId);
  }

  //GET /seances/:id/participants - Récupère la liste des participants d'une séance
  @Get(':id/participants')
  getParticipants(@Param('id') id: string) {
    return this.seancesService.getParticipants(id);
  }
  //PATCH /seances/:id/statut - Met à jour le statut d'une séance (seulement par le propriétaire)
  @Patch(':id/statut')
  updateStatut(
    @Param('id') id: string,
    @Body() updateStatutDto: UpdateStatutDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = request.user.sub;
    return this.seancesService.updateStatut(id, userId, updateStatutDto.statut);
  }

  // GET /seances/self - Récupère la séance créée par l'utilisateur connecté
  @Get('self')
  findMySeance(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.seancesService.findByProprietaire(userId);
  }
  // DELETE /seances/:id/leave - Quitter une séance
  @Delete(':id/leave')
  leave(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const userId = request.user.sub;
    return this.seancesService.leave(id, userId);
  }
}
