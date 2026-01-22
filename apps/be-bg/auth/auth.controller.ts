import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../../ms-mail/src/mail/mail.service';

interface SignInDto {
  username: string;
  password: string;
}

interface RegisterDto {
  nom?: string;
  email: string;
  password: string;
  role?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Post('login')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const nom = body.nom ?? body.email.split('@')[0];

    // Création de l'utilisateur avec token
    const user = await this.usersService.createUser(
      nom,
      body.email,
      body.password,
      body.role ?? 'user',
    );

    const confirmUrl = `http://localhost:3002/auth/confirm-email?token=${encodeURIComponent(user.email_verification_token)}`;

    const mailContent = `
      <h1>Confirme ton email 📩</h1>
      <p>Bonjour <strong>${nom}</strong>,</p>
      <p>Merci de confirmer ton compte CinéPotes :</p>
      <a href="${confirmUrl}" 
        style="display:inline-block;padding:12px 24px;
        background:#16a34a;color:#fff;border-radius:8px;
        text-decoration:none;font-weight:bold">
        Confirmer mon email
      </a>
    `;

    await this.mailService.sendEmail(
      body.email,
      'Confirmation de ton compte CinéPotes',
      mailContent,
    );

    return {
      status: HttpStatus.CREATED,
      message: 'Un email de confirmation a été envoyé',
    };
  }

  @Get('confirm-email')
  async confirmEmail(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const success = await this.usersService.confirmEmail(token);

    if (!success) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Lien invalide ou déjà utilisé');
    }

    // Redirection vers la page login de Next.js avec query param
    return res.redirect('http://localhost:3000/?confirmed=true');
  }
}
