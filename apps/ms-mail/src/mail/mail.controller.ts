import { Body, Controller, Post, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-link.dto';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}
  /* istanbul ignore next */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer un email' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email envoyé avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 500, description: 'Erreur lors de l\'envoi' })
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
}