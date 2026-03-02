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
  Patch
} from '@nestjs/common';
import type { Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';


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
  async login(
    @Body() body: { username: string; password: string },
  ): Promise<{ access_token: string }> {
    try {
      return await firstValueFrom(
        this.natsClient.send<{ access_token: string }>(
          'auth.login',
          body,
        ),
      );
    } catch (error: unknown) {
      throw this.handleError(
        error,
        'Erreur connexion',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /* ================= REGISTER ================= */

  @Post('register')
  async register(
    @Body() body: Record<string, unknown>,
  ): Promise<{ message: string }> {
    try {
      return await firstValueFrom(
        this.natsClient.send<{ message: string }>(
          'auth.register',
          body,
        ),
      );
    } catch (error: unknown) {
      throw this.handleError(
        error,
        'Erreur inscription',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /* ================= CONFIRM EMAIL ================= */

  @Get('confirm-email')
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
  async forgotPassword(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    const expiresInMinutes = Number.parseInt(
      this.configService.get<string>('RESET_PASSWORD_EXPIRES_MINUTES') ??
        '30',
      10,
    );

    return await firstValueFrom(
      this.natsClient.send<{ message: string }>(
        'auth.forgot-password',
        { email, expiresInMinutes },
      ),
    );
  }

  /* ================= RESET PASSWORD ================= */

  @Post('reset-password')
  async resetPassword(
    @Body() body: { token: string; newPassword: string },
  ): Promise<{ message: string }> {
    try {
      return await firstValueFrom(
        this.natsClient.send<{ message: string }>(
          'auth.reset-password',
          body,
        ),
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
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error
    ) {
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
  async me(@Req() req: { user: { sub: string } }) {
    return await firstValueFrom(
      this.natsClient.send('auth.me', { userId: req.user.sub }),
    );
  }

 @Patch('me')
  @UseGuards(AuthGuard)
  async updateMe(
    @Req() req: { user: { sub: string } },
    @Body() body: { nom: string },
  ) {
    if (!body?.nom?.trim()) {
      throw new HttpException('Le nom est requis', HttpStatus.BAD_REQUEST);
    }

    return await firstValueFrom(
      this.natsClient.send('auth.update-name', {
        userId: req.user.sub,
        nom: body.nom.trim(),
      }),
    );
  }


}