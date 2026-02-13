import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let addMock: jest.Mock;

  beforeEach(async () => {
    addMock = jest.fn().mockResolvedValue({ id: '1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: getQueueToken('mail'),
          useValue: { add: addMock },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Verifie que confirm-email cree un job dans la queue Redis
  it('should add a confirm-email job to the queue with the right data', async () => {
    await service.handleConfirmEmail(
      'user@test.com',
      'Jean',
      'http://localhost/confirm?token=abc',
    );

    // Le job doit contenir le destinataire, le sujet et le HTML avec le nom
    expect(addMock).toHaveBeenCalledWith(
      'send-mail',
      {
        to: 'user@test.com',
        subject: 'CinéPotes - Confirmez votre email',
        html: expect.stringContaining('Bienvenue Jean'),
      },
      expect.objectContaining({
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
      }),
    );
  });

  // Verifie que reset-password cree un job dans la queue Redis
  it('should add a reset-password job to the queue with the right data', async () => {
    await service.handleResetPassword(
      'user@test.com',
      'http://localhost/reset?token=xyz',
      30,
    );

    // Le job doit contenir le lien de reset dans le HTML
    expect(addMock).toHaveBeenCalledWith(
      'send-mail',
      {
        to: 'user@test.com',
        subject: 'CinéPotes - Réinitialisation du mot de passe',
        html: expect.stringContaining('Ce lien expire dans 30 minutes'),
      },
      expect.objectContaining({
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
      }),
    );
  });
});
