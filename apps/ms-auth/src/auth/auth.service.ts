import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string) {
    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new RpcException({ message: "username ou Mot de passe invalide", statusCode: 401 });
    }

    if (!user.email_verifie) {
      throw new RpcException({ message: "Merci de confirmer votre email avant de vous connecter", statusCode: 401 });
    }

    const passwordMatches = await bcrypt.compare(pass, user.mot_de_passe_hash);

    if (!passwordMatches) {
      throw new RpcException({ message: "username ou Mot de passe invalide", statusCode: 401 });
    }

    const payload = {
      sub: user.id,
      username: user.email,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
