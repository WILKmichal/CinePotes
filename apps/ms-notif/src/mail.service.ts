import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { confirmEmailTemplate } from "./templates/confirm-email.template";
import { resetPasswordTemplate } from "./templates/reset-password.template";
import { logAction, logSuccess } from "@workspace/logger";

@Injectable()
export class MailService {
  constructor(@InjectQueue("mail") private readonly mailQueue: Queue) {}

  async handleConfirmEmail(email: string, nom: string, confirmUrl: string, requestId?: string) {
    const html = confirmEmailTemplate(nom, confirmUrl);

    logAction('ms-notif', `Building confirmation email template for ${email}`, requestId);

    await this.mailQueue.add(
      "send-mail",
      {
        to: email,
        subject: "CinéPotes - Confirmez votre email",
        html,
        requestId,
      },
      {
        removeOnComplete: { age: 3600 }, // supprime après 1h
        removeOnFail: { age: 86400 }, // supprime après 24h
      },
    );

    logSuccess('ms-notif', `Confirmation email job added to queue for ${email}`, requestId);
  }

  async handleResetPassword(
    email: string,
    resetUrl: string,
    expiresInMinutes: number,
    requestId?: string,
  ) {
    const html = resetPasswordTemplate(resetUrl, expiresInMinutes);

    logAction('ms-notif', `Building password reset email template for ${email}`, requestId);

    await this.mailQueue.add(
      "send-mail",
      {
        to: email,
        subject: "CinéPotes - Réinitialisation du mot de passe",
        html,
        requestId,
      },
      {
        removeOnComplete: { age: 3600 }, // supprime après 1h
        removeOnFail: { age: 86400 }, // supprime après 24h
      },
    );

    logSuccess('ms-notif', `Password reset email job added to queue for ${email}`, requestId);
  }
}
