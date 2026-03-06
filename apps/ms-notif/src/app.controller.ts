import { Controller } from "@nestjs/common";
import { EventPattern, Payload, Ctx, NatsContext } from "@nestjs/microservices";
import { MailService } from "./mail.service";
import type { ConfirmEmailDto, ResetPasswordDto } from "@workspace/dtos/notifications";
import { logAction, logSuccess, logError, extractRequestId } from "@workspace/logger";

@Controller()
export class AppController {
  constructor(private readonly mailService: MailService) {}

  // be-bg emet 'notif.confirm-email' quand un utilisateur s'inscrit
  @EventPattern("notif.confirm-email")
  async handleConfirmEmail(@Payload() data: ConfirmEmailDto, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    
    try {
      logAction('ms-notif', `Sending confirmation email to: ${data.email}`, requestId);
      await this.mailService.handleConfirmEmail(
        data.email,
        data.nom,
        data.confirmUrl,
        requestId,
      );
      logSuccess('ms-notif', `Confirmation email queued for: ${data.email}`, requestId);
    } catch (error) {
      logError('ms-notif', `Error sending confirmation email to: ${data.email}`, requestId, error);
    }
  }

  // be-bg emet 'notif.reset-password' quand un utilisateur demande un reset de mdp
  @EventPattern("notif.reset-password")
  async handleResetPassword(@Payload() data: ResetPasswordDto, @Ctx() context: NatsContext) {
    const requestId = extractRequestId(context, data);
    
    try {
      logAction('ms-notif', `Sending password reset email to: ${data.email}`, requestId);
      await this.mailService.handleResetPassword(
        data.email,
        data.resetUrl,
        data.expiresInMinutes,
        requestId,
      );
      logSuccess('ms-notif', `Password reset email queued for: ${data.email}`, requestId);
    } catch (error) {
      logError('ms-notif', `Error sending password reset email to: ${data.email}`, requestId, error);
    }
  }
}
