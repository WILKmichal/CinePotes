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
  Delete,
} from '@nestjs/common';
import type { Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  ConfirmEmailDto,
  DeleteMePayload,
  ForgotPasswordDto,
  GuestLoginDto,
  GuestLoginResponseDto,
  LoginDto,
  MePayload,
  RegisterDto,
  ResetPasswordDto,
  UpdateNameDto,
  UpdateNamePayload,
} from '@workspace/dtos/auth';
import { NatsClientWrapper } from '../nats/nats-client-wrapper.service';

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
    private readonly natsClient: NatsClientWrapper,
  ) {}

  /* ================= LOGIN ================= */

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })  // 5 tentatives/minute
  @HttpCode(200)
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Retourne un access_token JWT',
    schema: {
      example: { access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Identifiants invalides ou email non confirmé',
  })
  async login(@Body() body: LoginDto): Promise<{ access_token: string }> {
    try {
      return await firstValueFrom(
        this.natsClient.send<{ access_token: string }>('auth.login', body),
      );
    } catch (error: unknown) {
      const err = error as { message?: string; statusCode?: number };
      throw new HttpException(
        err?.message ?? 'Identifiants incorrects.',
        err?.statusCode ?? HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /* ================= REGISTER ================= */

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 3 } })  // 3 inscriptions/minute
  @ApiOperation({ summary: 'Inscription utilisateur' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Email de confirmation envoyé',
    schema: {
      example: { status: 201, message: 'Email de confirmation envoyé' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou email déjà utilisé',
  })
  async register(@Body() body: RegisterDto): Promise<{ message: string }> {
    try {
      return await firstValueFrom(
        this.natsClient.send<{ message: string }>('auth.register', body),
      );
    } catch (error: unknown) {
      const err = error as { message?: string; statusCode?: number };
      throw new HttpException(
        err?.message ?? 'Erreur lors de la création du compte.',
        err?.statusCode ?? HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('guest-login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Connexion en tant que visiteur (sans compte)' })
  @ApiBody({ type: GuestLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Retourne un access_token JWT pour la session invité',
    type: GuestLoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Nom d\'affichage invalide',
  })
  async guestLogin(@Body() body: GuestLoginDto): Promise<GuestLoginResponseDto> {
    try {
      return await firstValueFrom(
        this.natsClient.send<GuestLoginResponseDto>('auth.guest-login', body),
      );
    } catch (error: unknown) {
      const err = error as { message?: string; statusCode?: number };
      throw new HttpException(
        err?.message ?? 'Erreur lors de la connexion invité.',
        err?.statusCode ?? HttpStatus.BAD_REQUEST,
      );
    }
  }

  /* ================= CONFIRM EMAIL ================= */

  @Get('confirm-email')
  @ApiOperation({ summary: 'Confirmation email via token' })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Token de confirmation reçu par email',
    example: 'uuid-token-ici',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirige vers le frontend après confirmation',
  })
  @ApiResponse({ status: 400, description: 'Lien invalide ou expiré' })
  async confirmEmail(
    @Query() query: ConfirmEmailDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const result = await firstValueFrom<{ success: boolean }>(
        this.natsClient.send('auth.confirm-email', { token: query.token }),
      );

      if (!result?.success) {
        res.status(400).send('Lien invalide ou expiré');
        return;
      }

      res.redirect(
        'http://localhost:3001/auth/callback',
      );
    } catch {
      res.status(400).send('Lien invalide ou expiré');
    }
  }

  /* ================= FORGOT PASSWORD ================= */

  @Post('forgot-password')
  @Throttle({ default: { ttl: 60000, limit: 3 } })  // 3 demandes/minute
  @ApiOperation({ summary: 'Demande de réinitialisation de mot de passe' })
  @ApiBody({
    schema: {
      properties: { email: { type: 'string', example: 'user@email.com' } },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Email envoyé si le compte existe',
    schema: {
      example: {
        message:
          'Si un compte existe avec cette adresse mail, un email a été envoyé',
      },
    },
  })
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return await firstValueFrom(
      this.natsClient.send<{ message: string }>('auth.forgot-password', {
        email: body.email,
      }),
    );
  }

  /* ================= RESET PASSWORD ================= */

  @Post('reset-password')
  @ApiOperation({ summary: 'Réinitialisation du mot de passe' })
  @ApiBody({
    schema: {
      properties: {
        token: { type: 'string', example: 'reset-token-reçu-par-email' },
        newPassword: { type: 'string', example: 'nouveauMotDePasse123' },
      },
      required: ['token', 'newPassword'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Mot de passe réinitialisé avec succès',
    schema: { example: { message: 'Mot de passe réinitialisé avec succès' } },
  })
  @ApiResponse({ status: 400, description: 'Lien invalide ou expiré' })
  async resetPassword(
    @Body() body: ResetPasswordDto,
  ): Promise<{ message: string }> {
    try {
      return await firstValueFrom(
        this.natsClient.send<{ message: string }>('auth.reset-password', body),
      );
    } catch (error: unknown) {
      throw this.handleError(
        error,
        'Lien invalide ou expiré',
        HttpStatus.BAD_REQUEST,
      );
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
    const payload: MePayload = { userId: req.user.sub };
    return await firstValueFrom(
      this.natsClient.send<{
        id: string;
        username: string;
        email: string;
        nom?: string;
      }>('auth.me', payload),
    );
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateMe(
    @Req() req: { user: { sub: string } },
    @Body() body: UpdateNameDto,
  ): Promise<{ message: string; nom: string }> {
    if (!body?.nom?.trim()) {
      throw new HttpException('Le nom est requis', HttpStatus.BAD_REQUEST);
    }

    const payload: UpdateNamePayload = {
      userId: req.user.sub,
      nom: body.nom.trim(),
    };

    return await firstValueFrom(
      this.natsClient.send<{ message: string; nom: string }>(
        'auth.update-name',
        payload,
      ),
    );
  }

  @Delete('me')
  @UseGuards(AuthGuard)
  async deleteMe(
    @Req() req: { user: { sub: string } },
  ): Promise<{ message: string }> {
    const payload: DeleteMePayload = { userId: req.user.sub };
    return await firstValueFrom(
      this.natsClient.send<{ message: string }>('auth.delete-me', payload),
    );
  }
}
