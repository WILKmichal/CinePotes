import { Injectable, Logger } from '@nestjs/common';
import { confirmEmailTemplate } from './templates/confirm-email.template';
import { resetPasswordTemplate } from './templates/reset-password.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  handleConfirmEmail(email: string, nom: string, confirmUrl: string) {
    const html = confirmEmailTemplate(nom, confirmUrl);

    this.logger.log(`[confirm-email] Template construit pour ${email}`);
    this.logger.debug(html);

    // TODO: envoyer dans la queue BullMQ pour le Worker Gmail
  }

  handleResetPassword(
    email: string,
    resetUrl: string,
    expiresInMinutes: number,
  ) {
    const html = resetPasswordTemplate(resetUrl, expiresInMinutes);

    this.logger.log(`[reset-password] Template construit pour ${email}`);
    this.logger.debug(html);

    // TODO: envoyer dans la queue BullMQ pour le Worker Gmail
  }
}
