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
import { UsersService } from '../src/users/users.service';
import { MailService } from '../../ms-mail/src/mail/mail.service';
import { User, UserRole } from 'src/users/entities/user.entity';

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
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.signIn(body.username, body.password);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    console.log('NODE_ENV:', process.env.NODE_ENV);

    const nom = body.nom ?? body.email.split('@')[0];
    const role = body.role ?? 'user';
    const roleEnum = role as UserRole;

    const user = await this.usersService.createUser(
      nom,
      body.email,
      body.password,
      roleEnum,
    );

  // condition pour bypasser l'envoi de mail 
  if (process.env.NODE_ENV !== 'test') {
    const confirmUrl = `http://localhost:3002/auth/confirm-email?token=${encodeURIComponent(
      user.email_verification_token ?? '',
    )}`;

    await this.mailService.sendEmail(
      body.email,
      'Confirmation de votre compte CinéPotes',
      `
      <h2>Bienvenue ${nom} 🎬</h2>
      <p>Merci de confirmer votre email :</p>
      <a href="${confirmUrl}">Confirmer mon email</a>
      `,
    );
  }

  return {
    status: HttpStatus.CREATED,
    message: 'Email de confirmation envoyé',
  };
}


  @Get('confirm-email')
  async confirmEmail(
    @Query('token') token: string,
    @Res() res: Response,
  ) {

    const ok = await this.usersService.confirmEmail(token);

    if (!ok) {
      return res.status(400).send('Lien invalide ou expiré');
    }

    return res.redirect('http://localhost:3000/?redirect=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fcallback');
  }
}
