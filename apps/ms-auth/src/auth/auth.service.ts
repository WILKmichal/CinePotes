import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { logAction, logSuccess, logError } from "@workspace/logger";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string) {
    logAction('ms-auth', `User attempting login: ${username}`);
    const user = await this.usersService.findOne(username);

    if (!user) {
      logError('ms-auth', `Login failed: user not found - ${username}`);
      throw new RpcException({ message: "username ou Mot de passe invalide", statusCode: 401 });
    }

    if (!user.email_verifie) {
      logError('ms-auth', `Login failed: email not verified - ${username}`);
      throw new RpcException({ message: "Merci de confirmer votre email avant de vous connecter", statusCode: 401 });
    }

    const passwordMatches = await bcrypt.compare(pass, user.mot_de_passe_hash);

    if (!passwordMatches) {
      logError('ms-auth', `Login failed: invalid password - ${username}`);
      throw new RpcException({ message: "username ou Mot de passe invalide", statusCode: 401 });
    }

    const payload = {
      sub: user.id,
      username: user.email,
    };

    logSuccess('ms-auth', `User logged in successfully: ${username}`);
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async verifyToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload;
    } catch (error) {
      throw new RpcException({ 
        message: "Token invalide ou expiré", 
        statusCode: 401 
      });
    }
  }

  async signInGuest(displayName: string) {
    logAction('ms-auth', `Creating guest user: ${displayName}`);
    const user = await this.usersService.createGuestUser(displayName);

    const payload = {
      sub: user.id,
      username: user.nom,
      role: 'guest',
    };

    logSuccess('ms-auth', `Guest user created and logged in: ${displayName}`);
    return {
      access_token: await this.jwtService.signAsync(payload),
      userId: user.id,
      displayName: user.nom,
    };
  }
}
