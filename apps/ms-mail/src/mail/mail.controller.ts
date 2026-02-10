import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-link.dto';
import { pageReiniMotDePasse } from './app/page';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer un email' })
  @ApiResponse({
    status: 200,
    description: 'Email envoyé avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 500, description: "Erreur lors de l'envoi" })
  async sendEmail(@Body() sendMailDto: SendMailDto) {
    await this.mailService.sendEmail(
      sendMailDto.email,
      sendMailDto.subject,
      sendMailDto.content,
    );

    return {
      message: 'Email envoyé avec succès',
    };
  }
  @Get('health')
  @ApiOperation({ summary: 'Vérifier la connexion SMTP' })
  @ApiResponse({ status: 200, description: 'État de la connexion' })
  async verifySmtp() {
    const isValid = await this.mailService.verifyConnection();

    return {
      connected: isValid,
      message: isValid ? 'Connexion SMTP OK' : 'Connexion SMTP échouée',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer un email de réinitialisation' })
  async resetPassword(@Body() body: {
    email: string;
    resetUrl: string;
    expiresInMinutes: number;
  }) {
    const html = pageReiniMotDePasse(body.resetUrl, body.expiresInMinutes);

    await this.mailService.sendEmail(
      body.email,
      'Réinitialisation de votre mot de passe',
      html,
    );

    return { message: 'Reset password email envoyé' };
  }
}