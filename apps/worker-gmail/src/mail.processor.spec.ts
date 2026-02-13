import { MailProcessor } from "./mail.processor";
import { Job } from "bullmq";

interface SendMailData {
  to: string;
  subject: string;
  html: string;
}

jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" }),
  }),
}));

describe("MailProcessor", () => {
  let processor: MailProcessor;
  let sendMailMock: jest.Mock;

  beforeEach(() => {
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "test@test.com";
    process.env.SMTP_PASSWORD = "password";

    processor = new MailProcessor();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    sendMailMock = (processor as any).transporter.sendMail;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(processor).toBeDefined();
  });

  // Quand un job arrive dans la queue, on envoie le mail avec les bonnes infos
  it("should send an email with correct parameters", async () => {
    const job = {
      data: {
        to: "user@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
      },
    } as Job<SendMailData>;

    await processor.process(job);

    expect(sendMailMock).toHaveBeenCalledWith({
      from: '"CinéPotes" <test@test.com>',
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
    });
  });

  // Si le SMTP plante, l'erreur doit remonter pour que BullMQ retry
  it("should throw if sendMail fails", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("SMTP error"));

    const job = {
      data: {
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      },
    } as Job<SendMailData>;

    await expect(processor.process(job)).rejects.toThrow("SMTP error");
  });
});
