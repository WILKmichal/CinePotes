import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string) {
    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    if (!user.email_verifie) {
      throw new UnauthorizedException(
        'Merci de confirmer votre email avant de vous connecter',
      );
    }

    const passwordMatches = await bcrypt.compare(
      pass,
      user.mot_de_passe_hash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Mot de passe invalide');
    }

    const payload = {
      sub: user.userId,
      username: user.email, // 🔥 IMPORTANT
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

}
