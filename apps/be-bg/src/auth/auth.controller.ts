import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Post,
  Query,
  Res,
  HttpCode,
  HttpException,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import type { Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

interface MicroserviceError {
  message?: string;
  statusCode?: number;
}

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  /* ================= LOGIN ================= */

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Retourne un access_token JWT', schema: { example: { access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } } })
  @ApiResponse({ status: 401, description: 'Identifiants invalides ou email non confirmé' })
  async login(
    @Body() body: LoginDto,
  ): Promise<{ access_token: string }> {
    try {
      return await firstValueFrom(
        this.natsClient.send<{ access_token: string }>('auth.login', body),
      );
    } catch (error: unknown) {
      throw this.handleError(error, 'Erreur connexion', HttpStatus.UNAUTHORIZED);
    }
  }

  /* ================= REGISTER ================= */

  @Post('register')
  @ApiOperation({ summary: 'Inscription utilisateur' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Email de confirmation envoyé', schema: { example: { status: 201, message: 'Email de confirmation envoyé' } } })
  @ApiResponse({ status: 400, description: 'Données invalides ou email déjà utilisé' })
  async register(
    @Body() body: RegisterDto,
  ): Promise<{ message: string }> {
    try {
      return await firstValueFrom(
        this.natsClient.send<{ message: string }>('auth.register', body),
      );
    } catch (error: unknown) {
      throw this.handleError(error, 'Erreur inscription', HttpStatus.BAD_REQUEST);
    }
  }

  /* ================= CONFIRM EMAIL ================= */

  @Get('confirm-email')
  @ApiOperation({ summary: 'Confirmation email via token' })
  @ApiQuery({ name: 'token', required: true, description: 'Token de confirmation reçu par email', example: 'uuid-token-ici' })
  @ApiResponse({ status: 302, description: 'Redirige vers le frontend après confirmation' })
  @ApiResponse({ status: 400, description: 'Lien invalide ou expiré' })
  async confirmEmail(
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const result = await firstValueFrom<{ success: boolean }>(
        this.natsClient.send('auth.confirm-email', { token }),
      );

      if (!result?.success) {
        res.status(400).send('Lien invalide ou expiré');
        return;
      }

      res.redirect(
        'http://localhost:3000/?redirect=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fcallback',
      );
    } catch {
      res.status(400).send('Lien invalide ou expiré');
    }
  }

  /* ================= FORGOT PASSWORD ================= */

  @Post('forgot-password')
  @ApiOperation({ summary: 'Demande de réinitialisation de mot de passe' })
  @ApiBody({ schema: { properties: { email: { type: 'string', example: 'user@email.com' } }, required: ['email'] } })
  @ApiResponse({ status: 201, description: 'Email envoyé si le compte existe', schema: { example: { message: 'Si un compte existe avec cette adresse mail, un email a été envoyé' } } })
  async forgotPassword(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    const expiresInMinutes = Number.parseInt(
      this.configService.get<string>('RESET_PASSWORD_EXPIRES_MINUTES') ?? '30',
      10,
    );

    return await firstValueFrom(
      this.natsClient.send<{ message: string }>('auth.forgot-password', {
        email,
        expiresInMinutes,
      }),
    );
  }

  /* ================= RESET PASSWORD ================= */

  @Post('reset-password')
  @ApiOperation({ summary: 'Réinitialisation du mot de passe' })
  @ApiBody({ schema: { properties: { token: { type: 'string', example: 'reset-token-reçu-par-email' }, newPassword: { type: 'string', example: 'nouveauMotDePasse123' } }, required: ['token', 'newPassword'] } })
  @ApiResponse({ status: 201, description: 'Mot de passe réinitialisé avec succès', schema: { example: { message: 'Mot de passe réinitialisé avec succès' } } })
  @ApiResponse({ status: 400, description: 'Lien invalide ou expiré' })
  async resetPassword(
    @Body() body: { token: string; newPassword: string },
  ): Promise<{ message: string }> {
    try {
      return await firstValueFrom(
        this.natsClient.send<{ message: string }>('auth.reset-password', body),
      );
    } catch (error: unknown) {
      throw this.handleError(error, 'Lien invalide ou expiré', HttpStatus.BAD_REQUEST);
    }
  }

  /* ================= PRIVATE ERROR HANDLER ================= */

  private handleError(
    error: unknown,
    fallbackMessage: string,
    fallbackStatus: number,
  ): HttpException {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const err = error as MicroserviceError;
      return new HttpException(
        err.message ?? fallbackMessage,
        err.statusCode ?? fallbackStatus,
      );
    }

    return new HttpException(fallbackMessage, fallbackStatus);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(
    @Req() req: { user: { sub: string } },
  ): Promise<{ id: string; username: string; email: string; nom?: string }> {
    return await firstValueFrom(
      this.natsClient.send<{
        id: string;
        username: string;
        email: string;
        nom?: string;
      }>('auth.me', { userId: req.user.sub }),
    );
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateMe(
    @Req() req: { user: { sub: string } },
    @Body() body: { nom: string },
  ): Promise<{ message: string; nom: string }> {
    if (!body?.nom?.trim()) {
      throw new HttpException('Le nom est requis', HttpStatus.BAD_REQUEST);
    }

    return await firstValueFrom(
      this.natsClient.send<{ message: string; nom: string }>(
        'auth.update-name',
        {
          userId: req.user.sub,
          nom: body.nom.trim(),
        },
      ),
    );
  }
}
