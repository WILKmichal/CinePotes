import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Post('register')
  async register(
    @Body()
    body: {
      nom?: string;
      email: string;
      password: string;
      role?: string;
    },
  ) {
    const nom = body.nom ?? body.email.split('@')[0];
    const role = body.role ?? 'user';
    // Basic validation
    if (!body.email || !body.password) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Email et password requis',
      };
    }
    const created = await this.usersService.createUser(
      nom,
      body.email,
      body.password,
      role,
    );
    return { status: HttpStatus.CREATED, user: created };
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}

