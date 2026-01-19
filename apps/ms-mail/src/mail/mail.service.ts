import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private smtpTransporter: Transporter;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<string>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      throw new Error('Missing SMTP configuration');
    }

    this.smtpTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }

  async sendEmail(
    toEmail: string,
    subject: string,
    content: string,
  ): Promise<void> {
    const fromEmail = this.configService.get<string>('SMTP_USER');

    const mailOptions = {
      from: fromEmail,
      to: toEmail,
      subject: 'Votre lien personnel',
      text: ``,
      html: this.buildEmailTemplate(content),
    };

    try {
      const info = (await this.smtpTransporter.sendMail(mailOptions)) as {
        messageId: string;
      };
      this.logger.log(
        `Email envoyé à ${toEmail}. MessageId: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi à ${toEmail}`, error);
      throw new Error("Échec de l'envoi de l'email");
    }
  }

  private buildEmailTemplate(content: string): string {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:20px;font-family:Arial,sans-serif;background-color:#f3f4f6;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;"><tr><td style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;text-align:center;"><img src="https://img.icons8.com/?size=100&id=11860&format=png&color=4F46E5" alt="CinePotes" width="32" height="32" style="vertical-align:middle;margin-right:8px;"><span style="color:#2563eb;font-size:20px;font-weight:700;vertical-align:middle;">CinéPotes</span></td></tr><tr><td height="16"></td></tr><tr><td style="background:#fff;border-radius:16px;padding:24px;">${content}</td></tr><tr><td height="16"></td></tr><tr><td style="text-align:center;padding:16px;color:#6b7280;font-size:12px;">&copy; 2025 CinéPotes - Tous droits réservés<br>Email automatique, merci de ne pas répondre.</td></tr></table></body></html>`;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.smtpTransporter.verify();
      this.logger.log('Connexion SMTP vérifiée avec succès');
      return true;
    } catch (error) {
      this.logger.error('Erreur de connexion SMTP', error);
      return false;
    }
  }
}
