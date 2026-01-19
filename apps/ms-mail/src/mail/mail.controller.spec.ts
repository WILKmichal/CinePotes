import { Test, TestingModule } from '@nestjs/testing';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';

describe('MailController', () => {
  let controller: MailController;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        {
          provide: MailService,
          useValue: {
            sendEmail: jest.fn(),        
            verifyConnection: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MailController>(MailController);
    mailService = module.get<MailService>(MailService);
  });

  //test instancié
  it('doit être instancié', () => {
    expect(controller).toBeDefined();
  });

  //envoyer des email
  it('doit envoyer des email', async () => {
    // mock undefined car Promise<void> return undefined en cas de succès
    (mailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

    // On appelle la méthode
    const result = await controller.sendEmail({
      email: 'test@test.com',
      subject: 'Hello',
      content: 'World',
    });

    // vérif
    expect(result.message).toBe('Email envoyé avec succès');
  });

  //vérifier la connexion SMTP
  it('doit vérifier la connexion SMTP (si elle fonctione)', async () => {
    (mailService.verifyConnection as jest.Mock).mockResolvedValue(true);
    const result = await controller.verifySmtp();
    // vérif
    expect(result.connected).toBe(true);
  });

  //vérifier la connexion SMTP
  it('doit vérifier la connexion SMTP (si elle fonctione pas)', async () => {
    (mailService.verifyConnection as jest.Mock).mockResolvedValue(false);
    const result = await controller.verifySmtp();
    // vérif
    expect(result.connected).toBe(false);
  });
});
