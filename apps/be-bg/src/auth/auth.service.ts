import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    const hashed = user.mot_de_passe_hash;
    const passwordMatches = await bcrypt.compare(pass, hashed);
    if (!passwordMatches) {
      throw new UnauthorizedException('Mot de passe invalide');
    }

    const payload = {
      sub: user.userId,
      username: user.email ?? user.nom,
      role: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
