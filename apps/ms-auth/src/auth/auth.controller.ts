import {
  BadRequestException,
  HttpStatus,
  Inject,
  Controller,
  UnauthorizedException,
} from "@nestjs/common";
import { MessagePattern, Payload, ClientProxy } from "@nestjs/microservices";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { UserRole } from "schemas/user.entity";
import { LoginDto } from "../../../be-bg/src/auth/dto/login.dto";
import { RegisterDto } from "../../../be-bg/src/auth/dto/register.dto";

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @Inject("NATS_SERVICE") private readonly natsClient: ClientProxy,
  ) {}

  /* ================= LOGIN ================= */
  // be-bg : natsClient.send('auth.login', { username, password })
  @MessagePattern("auth.login")
  async login(@Payload() body: LoginDto) {
    return this.authService.signIn(body.username, body.password);
  }

  /* ================= REGISTER =================  */
  // be-bg : natsClient.send('auth.register', { nom?, email, password, role? })
  @MessagePattern("auth.register")
  async register(@Payload() body: RegisterDto) {
    const nom = body.nom ?? body.email.split("@")[0];
    const role = (body.role ?? "user") as UserRole;

    const user = await this.usersService.createUser(
      nom,
      body.email,
      body.password,
      role,
    );

    if (process.env.VERIFICATION_MAIL !== "true") {
      const confirmUrl = `http://localhost:3002/auth/confirm-email?token=${encodeURIComponent(
        user.email_verification_token ?? "",
      )}`;

      this.natsClient.emit("notif.confirm-email", {
        email: body.email,
        nom,
        confirmUrl,
      });
    }

    return {
      status: HttpStatus.CREATED,
      message: "Email de confirmation envoyé",
    };
  }

  /* ================= CONFIRM EMAIL ================= */
  // be-bg : natsClient.send('auth.confirm-email', { token })
  @MessagePattern("auth.confirm-email")
  async confirmEmail(@Payload() data: { token: string }) {
    const ok = await this.usersService.confirmEmail(data.token);
    if (!ok) {
      return { success: false, message: "Lien invalide ou expiré" };
    }
    return { success: true };
  }

  /* ================= FORGOT PASSWORD ================= */
  // be-bg : natsClient.send('auth.forgot-password', { email, expiresInMinutes })
  @MessagePattern("auth.forgot-password")
  async forgotPassword(
    @Payload() data: { email: string; expiresInMinutes?: number },
  ) {
    const expiresInMinutes = data.expiresInMinutes ?? 30;

    const token = await this.usersService.issuePasswordResetToken(
      data.email,
      expiresInMinutes,
    );

    if (token) {
      const frontUrl =
        process.env.FRONT_RESET_PASSWORD_URL ??
        "http://localhost:3000/reset-password";
      const resetUrl = `${frontUrl}?token=${encodeURIComponent(token)}`;

      this.natsClient.emit("notif.reset-password", {
        email: data.email,
        resetUrl,
        expiresInMinutes,
      });
    }

    return {
      message:
        "Si un compte existe avec cette adresse mail, un email a été envoyé",
    };
  }

  /* ================= RESET PASSWORD ================= */
  // be-bg : natsClient.send('auth.reset-password', { token, newPassword })
  @MessagePattern("auth.reset-password")
  async resetPassword(@Payload() body: { token: string; newPassword: string }) {
    const ok = await this.usersService.resetPasswordWithToken(
      body.token,
      body.newPassword,
    );

    if (!ok) {
      throw new BadRequestException("Lien invalide ou expiré");
    }

    return { message: "Mot de passe réinitialisé avec succès" };
  }

  /* ================= PING ================= */
  @MessagePattern("auth.ping")
  ping() {
    return { status: "ok", service: "ms-auth" };
  }

  @MessagePattern("auth.me")
  async meById(@Payload() data: { userId: string }) {
    const user = await this.usersService.findProfileById(data.userId);

    if (!user) {
      throw new UnauthorizedException("Utilisateur introuvable");
    }

    return user;
  }

  @MessagePattern("auth.update-name")
  async updateName(@Payload() data: { userId: string; nom: string }) {
    const nom = data.nom?.trim();
    if (!nom) throw new BadRequestException("Le nom est requis");

    const user = await this.usersService.updateProfileNom(data.userId, nom);
    if (!user) throw new UnauthorizedException("Utilisateur introuvable");

    return user;
  }

  @MessagePattern('auth.delete-me')
  async deleteMe(@Payload() data: { userId: string }) {
    const deleted = await this.usersService.deleteAccount(data.userId);
    if (!deleted) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    // Optionnel: événements de nettoyage vers les autres MS
    this.natsClient.emit('user.deleted', { userId: data.userId });

    return { message: 'Compte supprimé avec succès' };
  }

}
