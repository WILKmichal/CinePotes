import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let mockTransporter: { sendMail: jest.Mock; verify: jest.Mock };

  const mockConfig: Record<string, string> = {
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_USER: 'test@example.com',
    SMTP_PASSWORD: 'password123',
  };

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  // constructor
  it('doit être instancié', () => {
    expect(service).toBeDefined();
  });

  it('doit lever une erreur si config SMTP manquante', async () => {
    await expect(
      Test.createTestingModule({
        providers: [
          MailService,
          { provide: ConfigService, useValue: { get: jest.fn() } },
        ],
      }).compile(),
    ).rejects.toThrow('Missing SMTP configuration');
  });

  // sendEmail
  it('doit envoyer un email avec succès', async () => {
    mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

    await service.sendEmail('user@test.com', 'Sujet', 'Contenu');

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'test@example.com',
        to: 'user@test.com',
      }),
    );
  });

  it("doit lever une erreur si l'envoi échoue", async () => {
    mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

    await expect(
      service.sendEmail('user@test.com', 'Sujet', 'Contenu'),
    ).rejects.toThrow("Échec de l'envoi de l'email");
  });

  // verifyConnection
  it('doit retourner true si connexion SMTP OK', async () => {
    mockTransporter.verify.mockResolvedValue(true);

    const result = await service.verifyConnection();

    expect(result).toBe(true);
  });

  it('doit retourner false si connexion SMTP échoue', async () => {
    mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

    const result = await service.verifyConnection();

    expect(result).toBe(false);
  });
});
