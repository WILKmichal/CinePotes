import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MailService } from './mail.service';

@Controller()
export class AppController {
  constructor(private readonly mailService: MailService) {}

  // be-bg emet 'notif.confirm-email' quand un utilisateur s'inscrit
  @EventPattern('notif.confirm-email')
  handleConfirmEmail(
    @Payload() data: { email: string; nom: string; confirmUrl: string },
  ) {
    this.mailService.handleConfirmEmail(data.email, data.nom, data.confirmUrl);
  }

  // be-bg emet 'notif.reset-password' quand un utilisateur demande un reset
  @EventPattern('notif.reset-password')
  handleResetPassword(
    @Payload()
    data: { email: string; resetUrl: string; expiresInMinutes: number },
  ) {
    this.mailService.handleResetPassword(
      data.email,
      data.resetUrl,
      data.expiresInMinutes,
    );
  }
}
