import {
  BadRequestException,
  HttpStatus,
  Inject,
  Controller,
  UnauthorizedException,
} from "@nestjs/common";
import { MessagePattern, Payload, ClientProxy, Ctx, NatsContext } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { LoginDto, RegisterDto, GuestLoginDto } from "@workspace/dtos/auth";
import type {
  ConfirmEmailPayload,
  DeleteMePayload,
  ForgotPasswordPayload,
  GuestLoginPayload,
  MePayload,
  ResetPasswordPayload,
  UpdateNamePayload,
  VerifyTokenPayload,
} from "@workspace/dtos/auth";
import { logNatsMessage, logAction, logSuccess, logError, extractRequestId } from "@workspace/logger";

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @Inject("NATS_SERVICE") private readonly natsClient: ClientProxy,
  ) {}

  /* ================= LOGIN ================= */
  // be-bg : natsClient.send('auth.login', { username, password })
  @MessagePattern("auth.login")
  async login(@Payload() body: LoginDto, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, body);
    logNatsMessage('ms-auth', 'auth.login', 'receive', requestId);
    
    try {
      logAction('ms-auth', `Login attempt for user: ${body.username}`, requestId);
      const result = await this.authService.signIn(body.username, body.password);
      logSuccess('ms-auth', `Login successful for user: ${body.username}`, requestId);
      return result;
    } catch (error) {
      logError('ms-auth', `Login failed for user: ${body.username}`, requestId, error);
      throw error;
    }
  }

  /* ================= REGISTER =================  */
  // be-bg : natsClient.send('auth.register', { nom?, email, password })
  @MessagePattern("auth.register")
  async register(@Payload() body: RegisterDto, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, body);
    logNatsMessage('ms-auth', 'auth.register', 'receive', requestId);
    
    try {
      const nom = body.nom ?? body.email.split("@")[0];
      logAction('ms-auth', `Registering new user: ${body.email}`, requestId);

      const user = await this.usersService.createUser(
        nom,
        body.email,
        body.password,
      );
      logSuccess('ms-auth', `User created: ${body.email}`, requestId);

      const verificationMail = this.configService.get<string>("VERIFICATION_MAIL");
      const isVerificationEnabled = verificationMail?.toLowerCase() === "true";

      if (!isVerificationEnabled) {
        const confirmUrl = `http://localhost:3002/auth/confirm-email?token=${encodeURIComponent(
          user.email_verification_token ?? "",
        )}`;

        logAction('ms-auth', `Emitting confirmation email to ms-notif for: ${body.email}`, requestId);
        this.natsClient.emit("notif.confirm-email", {
          email: body.email,
          nom,
          confirmUrl,
          requestId,
        });
      }

      return {
        status: HttpStatus.CREATED,
        message: "Email de confirmation envoyé",
      };
    } catch (error) {
      logError('ms-auth', `Registration failed for: ${body.email}`, requestId, error);
      throw error;
    }
  }

  /* ================= GUEST LOGIN ================= */
  // be-bg : natsClient.send('auth.guest-login', { displayName })
  @MessagePattern("auth.guest-login")
  async guestLogin(@Payload() body: GuestLoginDto, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, body);
    logNatsMessage('ms-auth', 'auth.guest-login', 'receive', requestId);
    
    try {
      logAction('ms-auth', `Guest login: ${body.displayName}`, requestId);
      const result = await this.authService.signInGuest(body.displayName);
      logSuccess('ms-auth', `Guest login successful for: ${body.displayName}`, requestId);
      return result;
    } catch (error) {
      logError('ms-auth', `Guest login failed for: ${body.displayName}`, requestId, error);
      throw error;
    }
  }

  /* ================= CONFIRM EMAIL ================= */
  // be-bg : natsClient.send('auth.confirm-email', { token })
  @MessagePattern("auth.confirm-email")
  async confirmEmail(@Payload() data: ConfirmEmailPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-auth', 'auth.confirm-email', 'receive', requestId);
    
    try {
      logAction('ms-auth', 'Confirming email with token', requestId);
      const ok = await this.usersService.confirmEmail(data.token);
      if (!ok) {
        logError('ms-auth', 'Email confirmation failed: invalid or expired token', requestId);
        return { success: false, message: "Lien invalide ou expiré" };
      }
      logSuccess('ms-auth', 'Email confirmed successfully', requestId);
      return { success: true };
    } catch (error) {
      logError('ms-auth', 'Email confirmation error', requestId, error);
      throw error;
    }
  }

  /* ================= FORGOT PASSWORD ================= */
  @MessagePattern("auth.forgot-password")
  async forgotPassword(
    @Payload() data: ForgotPasswordPayload,
    @Ctx() context: NatsContext,
  ) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-auth', 'auth.forgot-password', 'receive', requestId);
    
    try {
      logAction('ms-auth', `Password reset requested for: ${data.email}`, requestId);
      
      const expiresInMinutes = Number.parseInt(
        this.configService.get<string>('RESET_PASSWORD_EXPIRES_MINUTES')!,
        10,
      );

      const token = await this.usersService.issuePasswordResetToken(
        data.email,
        expiresInMinutes,
      );

      if (token) {
        const frontUrl =
          this.configService.get<string>('FRONT_RESET_PASSWORD_URL') ??
          "http://localhost:3001/reset-password";
        const resetUrl = `${frontUrl}?token=${encodeURIComponent(token)}`;

        logAction('ms-auth', `Emitting reset password email to ms-notif for: ${data.email}`, requestId);
        this.natsClient.emit("notif.reset-password", {
          email: data.email,
          resetUrl,
          expiresInMinutes,
          requestId,
        });
        logSuccess('ms-auth', `Password reset email queued for: ${data.email}`, requestId);
      }

      return {
        message:
          "Si un compte existe avec cette adresse mail, un email a été envoyé",
      };
    } catch (error) {
      logError('ms-auth', `Forgot password error for: ${data.email}`, requestId, error);
      throw error;
    }
  }

  /* ================= RESET PASSWORD ================= */
  // be-bg : natsClient.send('auth.reset-password', { token, newPassword })
  @MessagePattern("auth.reset-password")
  async resetPassword(@Payload() body: ResetPasswordPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, body);
    logNatsMessage('ms-auth', 'auth.reset-password', 'receive', requestId);
    
    try {
      logAction('ms-auth', 'Resetting password with token', requestId);
      const ok = await this.usersService.resetPasswordWithToken(
        body.token,
        body.newPassword,
      );

      if (!ok) {
        logError('ms-auth', 'Password reset failed: invalid or expired token', requestId);
        throw new BadRequestException("Lien invalide ou expiré");
      }

      logSuccess('ms-auth', 'Password reset successfully', requestId);
      return { message: "Mot de passe réinitialisé avec succès" };
    } catch (error) {
      logError('ms-auth', 'Password reset error', requestId, error);
      throw error;
    }
  }

  /* ================= VERIFY TOKEN ================= */
  // be-bg : natsClient.send('auth.verify-token', { token })
  @MessagePattern("auth.verify-token")
  async verifyToken(@Payload() data: VerifyTokenPayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-auth', 'auth.verify-token', 'receive', requestId);
    
    try {
      const result = await this.authService.verifyToken(data.token);
      logSuccess('ms-auth', 'Token verified successfully', requestId);
      return result;
    } catch (error) {
      logError('ms-auth', 'Token verification failed', requestId, error);
      throw error;
    }
  }

  /* ================= PING ================= */
  @MessagePattern("auth.ping")
  ping() {
    return { status: "ok", service: "ms-auth" };
  }

  @MessagePattern("auth.me")
  async meById(@Payload() data: MePayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-auth', 'auth.me', 'receive', requestId);
    
    try {
      logAction('ms-auth', `Fetching profile for user: ${data.userId}`, requestId);
      const user = await this.usersService.findProfileById(data.userId);

      if (!user) {
        logError('ms-auth', `User not found: ${data.userId}`, requestId);
        throw new UnauthorizedException("Utilisateur introuvable");
      }

      logSuccess('ms-auth', `Profile fetched for user: ${data.userId}`, requestId);
      return user;
    } catch (error) {
      logError('ms-auth', `Error fetching profile for: ${data.userId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern("auth.update-name")
  async updateName(@Payload() data: UpdateNamePayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-auth', 'auth.update-name', 'receive', requestId);
    
    try {
      const nom = data.nom?.trim();
      if (!nom) {
        logError('ms-auth', 'Update name failed: name is required', requestId);
        throw new BadRequestException("Le nom est requis");
      }

      logAction('ms-auth', `Updating name for user: ${data.userId}`, requestId);
      const user = await this.usersService.updateProfileNom(data.userId, nom);
      if (!user) {
        logError('ms-auth', `User not found for update: ${data.userId}`, requestId);
        throw new UnauthorizedException("Utilisateur introuvable");
      }

      logSuccess('ms-auth', `Name updated for user: ${data.userId}`, requestId);
      return user;
    } catch (error) {
      logError('ms-auth', `Error updating name for: ${data.userId}`, requestId, error);
      throw error;
    }
  }

  @MessagePattern("auth.delete-me")
  async deleteMe(@Payload() data: DeleteMePayload, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    logNatsMessage('ms-auth', 'auth.delete-me', 'receive', requestId);
    
    try {
      logAction('ms-auth', `Deleting account for user: ${data.userId}`, requestId);
      const deleted = await this.usersService.deleteAccount(data.userId);
      if (!deleted) {
        logError('ms-auth', `User not found for deletion: ${data.userId}`, requestId);
        throw new UnauthorizedException("Utilisateur introuvable");
      }

      // Optionnel: événements de nettoyage vers les autres MS
      logAction('ms-auth', `Emitting user.deleted event for: ${data.userId}`, requestId);
      this.natsClient.emit("user.deleted", { userId: data.userId, requestId });

      logSuccess('ms-auth', `Account deleted for user: ${data.userId}`, requestId);
      return { message: "Compte supprimé avec succès" };
    } catch (error) {
      logError('ms-auth', `Error deleting account for: ${data.userId}`, requestId, error);
      throw error;
    }
  }
}
