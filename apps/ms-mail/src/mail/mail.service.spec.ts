import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

// Mock de nodemailer
jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let mockTransporter: {
    sendMail: jest.Mock;
    verify: jest.Mock;
  };

  beforeEach(async () => {
    // Mock du transporter
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };

    // Mock de nodemailer.createTransport
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                SMTP_HOST: 'smtp.example.com',
                SMTP_PORT: '587',
                SMTP_USER: 'test@example.com',
                SMTP_PASSWORD: 'password123',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  // Test 1: instancié
  it('doit être instancié', () => {
    expect(service).toBeDefined();
  });

  // Test 2: envoyer un email avec succès
  it('doit envoyer un email avec succès', async () => {
    // On simule un succès
    mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });
    await service.sendEmail(
      'destinataire@test.com',
      'Sujet Test',
      'Contenu test',
    );

    // Vérifie que sendMail a été appelé
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'test@example.com',
        to: 'destinataire@test.com',
        subject: 'Votre lien personnel',
      }),
    );
  });

  // Test 3: gérer une erreur lors de l'envoi
  it("doit gérer une erreur lors de l'envoi d'email", async () => {
    // On simule une erreur
    mockTransporter.sendMail.mockRejectedValue(new Error('Erreur SMTP'));

    // On vérifie que l'erreur est bien lancée
    await expect(
      service.sendEmail('destinataire@test.com', 'Sujet', 'Contenu'),
    ).rejects.toThrow("Échec de l'envoi de l'email");
  });

  // Test 4: vérifier la connexion SMTP avec succès
  it('doit vérifier la connexion SMTP (succès)', async () => {
    mockTransporter.verify.mockResolvedValue(true);

    const result = await service.verifyConnection();

    expect(result).toBe(true);
    expect(mockTransporter.verify).toHaveBeenCalled();
  });

  // Test 5: vérifier la connexion SMTP en échec
  it('doit vérifier la connexion SMTP (échec)', async () => {
    mockTransporter.verify.mockRejectedValue(new Error('Connexion échouée'));

    const result = await service.verifyConnection();

    //verif
    expect(result).toBe(false);
  });
});
