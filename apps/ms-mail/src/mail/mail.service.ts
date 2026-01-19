import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ifError } from 'assert';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { type } from 'os';
import { throwError } from 'rxjs';
import { types } from 'util';

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

    this.smtpTransporter = nodemailer.createTransport(
        {
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
  }

  async sendEmail(toEmail: string, subject: string, content: string): Promise<void> {
    const fromEmail = this.configService.get('SMTP_USER');

    const mailOptions = {
      from: fromEmail,
      to: toEmail,
      subject: 'Votre lien personnel',
      text: ``,
      html: this.buildEmailTemplate(content),
    };

    try {
      const info = await this.smtpTransporter.sendMail(mailOptions);
      this.logger.log(`Email envoyé à ${toEmail}. MessageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi à ${toEmail}`, error);
      throw new Error('Échec de l\'envoi de l\'email');
    }
  }

  private buildEmailTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          <div class="wrapper">
            <!-- HEADER -->
            <div class="header">
              <h1>Cinepote</h1>
            </div>

            <!-- CONTENT (votre contenu personnalisé) -->
            <div class="content">
              ${content}
            </div>

            <!-- FOOTER -->
            <div class="footer">
              <p>
                <a href="https://cinepote.com">Site web</a> |
                <a href="https://cinepote.com/unsubscribe">Se désabonner</a>
              </p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;
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