import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MailService } from './mail.service';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller()
export class AppController {
  constructor(private readonly mailService: MailService) {}

  // be-bg emet 'notif.confirm-email' quand un utilisateur s'inscrit
  @EventPattern('notif.confirm-email')
  handleConfirmEmail(@Payload() data: ConfirmEmailDto) {
    this.mailService.handleConfirmEmail(data.email, data.nom, data.confirmUrl);
  }

  // be-bg emet 'notif.reset-password' quand un utilisateur demande un reset de mdp
  @EventPattern('notif.reset-password')
  handleResetPassword(@Payload() data: ResetPasswordDto) {
    this.mailService.handleResetPassword(
      data.email,
      data.resetUrl,
      data.expiresInMinutes,
    );
  }
}
