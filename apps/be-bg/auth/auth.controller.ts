import {BadRequestException, Body,Controller,Get,HttpStatus,Post,Query,Res,} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../src/users/users.service';
import { UserRole } from '../src/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { MailAdapter } from '../src/mail/mail.adapter';

interface RegisterDto {
  nom?: string;
  email: string;
  password: string;
  role?: UserRole;
}

@Controller('auth')
export class AuthController {
  mailService: any;
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly mailAdapter: MailAdapter,
  ) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.signIn(body.username, body.password);
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const nom = body.nom ?? body.email.split('@')[0];
    const role = body.role ?? UserRole.USER;

    const user = await this.usersService.createUser(
      nom,
      body.email,
      body.password,
      role,
    );

    const confirmUrl = `http://localhost:3002/auth/confirm-email?token=${encodeURIComponent(
      user.email_verification_token!,
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
  
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    const expiresInMinutes = Number.parseInt(
      this.configService.get<string>('RESET_PASSWORD_EXPIRES_MINUTES') ?? '30',
      10,
    );

    const token = await this.usersService.issuePasswordResetToken(
      email,
      expiresInMinutes,
    );

    if (token) {
      const frontUrl =
        this.configService.get<string>('FRONT_RESET_PASSWORD_URL') ??
        'http://localhost:3000/reset-password';

      const resetUrl = `${frontUrl}?token=${encodeURIComponent(token)}`;

      await this.mailAdapter.sendResetPasswordEmail({
        email,
        resetUrl,
        expiresInMinutes,
      });
    }

    return {
      message: 'Si un compte existe avec cette adresse mail, un email a été envoyé',
    };
  }


  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    const ok = await this.usersService.resetPasswordWithToken(
      body.token,
      body.newPassword,
    );

    if (!ok) {
      throw new BadRequestException('Lien invalide ou expiré');
    }

    return { message: 'Mot de passe réinitialisé avec succès' };
  }


}
