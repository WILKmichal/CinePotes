import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SeancesService } from './seances.service';
import { CreateSeanceDto } from './dto/create-seance.dto';
import { AuthGuard } from '@nestjs/passport';
import { JoinSeanceDto } from './dto/join-seance.dto';

@Controller('seances')
@UseGuards(AuthGuard('jwt'))
export class SeancesController {
  constructor(private readonly seancesService: SeancesService) {}

  //POST /seances - Crée une nouvelle séance
  @Post()
  create(@Body() createSeanceDto: CreateSeanceDto, @Request() request) {
    const userId = request.user.sub; // Récupère l'ID utilisateur depuis le JWT
    return this.seancesService.create(createSeanceDto, userId);
  }

  //POST /seances/join - Rejoindre une séance via son code
  @Post('join')
  join(@Body() joinSeanceDto: JoinSeanceDto, @Request() request) {
    const userId = request.user.sub;
    return this.seancesService.join(joinSeanceDto.code, userId);
  }

  //GET /seances/:id/participants - Récupère la liste des participants d'une séance
  @Get(':id/participants')
  getParticipants(@Param('id') id: string) {
    return this.seancesService.getParticipants(id);
  }

  @Patch(':id/statut')
  updateStatut(@Param('id') id: string, @Body('statut') statut: string, @Request() request) {
    const userId = request.user.sub;
    return this.seancesService.updateStatut(id, userId, statut);
  }

  // GET /seances/self - Récupère la séance créée par l'utilisateur connecté
  @Get('self')
  findMySeance(@Request() req) {
    const userId = req.user.sub;
    return this.seancesService.findByProprietaire(userId);
  }

  @Delete(':id/leave')
  leave(@Param('id') id: string, @Request() request) {
    const userId = request.user.sub;
    return this.seancesService.leave(id, userId);
  }
}
