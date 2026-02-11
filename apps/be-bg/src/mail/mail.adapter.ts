import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class MailAdapter {
  private readonly mailBaseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.mailBaseUrl =
      this.config.get<string>('MAIL_MS_BASE_URL') ?? 'http://localhost:3003';
  }

  async sendResetPasswordEmail(payload: {
    email: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): Promise<void> {
    await this.http.axiosRef.post(
      `${this.mailBaseUrl}/mail/reset-password`,
      payload,
    );
  }
}
