import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';

interface SendMailData {
  to: string;
  subject: string;
  html: string;
}

@Processor('mail')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async process(job: Job<SendMailData>): Promise<void> {
    const { to, subject, html } = job.data;

    this.logger.log(`Envoi du mail a ${to} (${subject})`);

    await this.transporter.sendMail({
      from: `"CinéPotes" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    this.logger.log(`Mail envoye avec succes a ${to}`);
  }
}
