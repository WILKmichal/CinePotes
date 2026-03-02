import {
  Body, Controller, Get, HttpStatus, Inject,
  Post, Query, Res, HttpCode, HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { username: string; password: string }) {
    try {
      return await firstValueFrom(this.natsClient.send('auth.login', body));
    } catch (err: any) {
      throw new HttpException(err?.message ?? 'Erreur connexion', err?.statusCode ?? HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('register')
  async register(@Body() body: Record<string, any>) {
    try {
      return await firstValueFrom(this.natsClient.send('auth.register', body));
    } catch (err: any) {
      throw new HttpException(err?.message ?? "Erreur inscription", err?.statusCode ?? HttpStatus.BAD_REQUEST);
    }
  }

  @Get('confirm-email')
  async confirmEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      const result = await firstValueFrom<{ success: boolean }>(
        this.natsClient.send('auth.confirm-email', { token }),
      );
      if (!result?.success) return res.status(400).send('Lien invalide ou expiré');
      return res.redirect('http://localhost:3000/?redirect=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fcallback');
    } catch {
      return res.status(400).send('Lien invalide ou expiré');
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    const expiresInMinutes = Number.parseInt(
      this.configService.get<string>('RESET_PASSWORD_EXPIRES_MINUTES') ?? '30', 10,
    );
    return firstValueFrom(this.natsClient.send('auth.forgot-password', { email, expiresInMinutes }));
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    try {
      return await firstValueFrom(this.natsClient.send('auth.reset-password', body));
    } catch (err: any) {
      throw new HttpException(err?.message ?? 'Lien invalide ou expiré', err?.statusCode ?? HttpStatus.BAD_REQUEST);
    }
  }
}