import { Processor, WorkerHost } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";
import * as nodemailer from "nodemailer";
import { logAction, logSuccess, logError } from "@workspace/logger";

interface SendMailData {
  to: string;
  subject: string;
  html: string;
  requestId?: string;
}

@Processor("mail")
export class MailProcessor extends WorkerHost {
  private readonly transporter: nodemailer.Transporter;
  private readonly smtpUser: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.smtpUser = this.configService.getOrThrow<string>("SMTP_USER");
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>("SMTP_HOST"),
      port: this.configService.getOrThrow<number>("SMTP_PORT"),
      secure: false,
      auth: {
        user: this.smtpUser,
        pass: this.configService.getOrThrow<string>("SMTP_PASSWORD"),
      },
    });
  }

  async process(job: Job<SendMailData>): Promise<void> {
    const { to, subject, html, requestId } = job.data;

    logAction('worker-gmail', `Sending email to ${to} (${subject})`, requestId);

    try {
      await this.transporter.sendMail({
        from: `"CinéPotes" <${this.smtpUser}>`,
        to,
        subject,
        html,
      });

      logSuccess('worker-gmail', `Email sent successfully to ${to}`, requestId);
    } catch (error) {
      logError('worker-gmail', `Failed to send email to ${to}`, requestId, error);
      throw error;
    }
  }
}
