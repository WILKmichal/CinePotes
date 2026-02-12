import { MailProcessor } from './mail.processor';
import { Job } from 'bullmq';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

describe('MailProcessor', () => {
  let processor: MailProcessor;
  let sendMailMock: jest.Mock;

  beforeEach(() => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASSWORD = 'password';

    processor = new MailProcessor();
    sendMailMock = (processor as any).transporter.sendMail;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should send an email with correct parameters', async () => {
    const job = {
      data: {
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
      },
    } as Job;

    await processor.process(job);

    expect(sendMailMock).toHaveBeenCalledWith({
      from: '"CinéPotes" <test@test.com>',
      to: 'user@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
    });
  });

  it('should throw if sendMail fails', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP error'));

    const job = {
      data: {
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      },
    } as Job;

    await expect(processor.process(job)).rejects.toThrow('SMTP error');
  });
});
