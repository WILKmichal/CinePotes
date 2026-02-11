import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../../../ms-mail/src/mail/mail.service';
import { UserRole } from 'src/users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  /* ================= LOGIN ================= */

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    return this.authService.signIn(body.username, body.password);
  }

  /* ================= REGISTER ================= */

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const nom = body.nom ?? body.email.split('@')[0];
    const role = (body.role ?? 'user') as UserRole;

    const user = await this.usersService.createUser(
      nom,
      body.email,
      body.password,
      role,
    );

    if (process.env.VERIFICATION_MAIL !== 'true') {
      const confirmUrl = `http://localhost:3002/auth/confirm-email?token=${encodeURIComponent(
        user.email_verification_token ?? '',
      )}`;

      await this.mailService.sendEmail(
        body.email,
        'Confirmation de votre compte CinéPotes',
        `<h2>Bienvenue ${nom} 🎬</h2>
<p>Merci de confirmer votre email :</p>
<a href="${confirmUrl}">Confirmer mon email</a>`,
      );
    }

    return {
      status: HttpStatus.CREATED,
      message: 'Email de confirmation envoyé',
    };
  }

  /* ================= CONFIRM EMAIL ================= */

  @Get('confirm-email')
  async confirmEmail(@Query('token') token: string, @Res() res: Response) {
    const ok = await this.usersService.confirmEmail(token);

    if (!ok) {
      return res.status(400).send('Lien invalide ou expiré');
    }

    return res.redirect(
      'http://localhost:3000/?redirect=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fcallback',
    );
  }

  /* ================= FORGOT PASSWORD ================= */

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

      await this.mailService.sendEmail(
        email,
        'Réinitialisation de votre mot de passe',
        `Cliquez ici pour réinitialiser votre mot de passe :
         ${resetUrl}
         (valide ${expiresInMinutes} minutes)`,
      );
    }

    return {
      message:
        'Si un compte existe avec cette adresse mail, un email a été envoyé',
    };
  }

  /* ================= RESET PASSWORD ================= */

  @Post('reset-password')
  async resetPassword(
    @Body() body: { token: string; newPassword: string },
  ) {
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
