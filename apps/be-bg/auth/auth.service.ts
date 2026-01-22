import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(
    username: string,
    password: string,
  ): Promise<{ access_token: string }> {
    // Cherche l'utilisateur
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    // ⚠️ Vérifie que l'email est confirmé
    if (!user.email_verifie) {
      throw new UnauthorizedException(
        'Merci de confirmer votre email avant de vous connecter',
      );
    }

    // Vérifie le mot de passe
    const passwordMatches = await bcrypt.compare(password, user.mot_de_passe_hash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Mot de passe invalide');
    }

    // Génère le token JWT
    const payload = { sub: user.userId, email: user.email, role: user.role };
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
