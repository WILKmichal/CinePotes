import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { confirmEmailTemplate } from "./templates/confirm-email.template";
import { resetPasswordTemplate } from "./templates/reset-password.template";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@InjectQueue("mail") private readonly mailQueue: Queue) {}

  async handleConfirmEmail(email: string, nom: string, confirmUrl: string) {
    const html = confirmEmailTemplate(nom, confirmUrl);

    this.logger.log(`[confirm-email] Template construit pour ${email}`);

    await this.mailQueue.add(
      "send-mail",
      {
        to: email,
        subject: "CinéPotes - Confirmez votre email",
        html,
      },
      {
        removeOnComplete: { age: 3600 }, // supprime après 1h
        removeOnFail: { age: 86400 }, // supprime après 24h
      },
    );

    this.logger.log(`[confirm-email] Job ajouté dans la queue pour ${email}`);
  }

  async handleResetPassword(
    email: string,
    resetUrl: string,
    expiresInMinutes: number,
  ) {
    const html = resetPasswordTemplate(resetUrl, expiresInMinutes);

    this.logger.log(`[reset-password] Template construit pour ${email}`);

    await this.mailQueue.add(
      "send-mail",
      {
        to: email,
        subject: "CinéPotes - Réinitialisation du mot de passe",
        html,
      },
      {
        removeOnComplete: { age: 3600 }, // supprime après 1h
        removeOnFail: { age: 86400 }, // supprime après 24h
      },
    );

    this.logger.log(`[reset-password] Job ajouté dans la queue pour ${email}`);
  }
}
