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

  describe('handleConfirmEmail', () => {
    it('should add a job to the mail queue', async () => {
      await service.handleConfirmEmail(
        'user@test.com',
        'Jean',
        'http://localhost/confirm?token=abc',
      );

      expect(addMock).toHaveBeenCalledWith('send-mail', {
        to: 'user@test.com',
        subject: 'CinéPotes - Confirmez votre email',
        html: expect.stringContaining('Bienvenue Jean'),
      });
    });

    it('should include the confirm URL in the HTML', async () => {
      await service.handleConfirmEmail(
        'user@test.com',
        'Jean',
        'http://localhost/confirm?token=abc',
      );

      const htmlArg = addMock.mock.calls[0][1].html;
      expect(htmlArg).toContain('http://localhost/confirm?token=abc');
    });
  });

  describe('handleResetPassword', () => {
    it('should add a job to the mail queue', async () => {
      await service.handleResetPassword(
        'user@test.com',
        'http://localhost/reset?token=xyz',
        30,
      );

      expect(addMock).toHaveBeenCalledWith('send-mail', {
        to: 'user@test.com',
        subject: 'CinéPotes - Réinitialisation du mot de passe',
        html: expect.stringContaining('http://localhost/reset?token=xyz'),
      });
    });

    it('should include expiration time in the HTML', async () => {
      await service.handleResetPassword(
        'user@test.com',
        'http://localhost/reset?token=xyz',
        30,
      );

      const htmlArg = addMock.mock.calls[0][1].html;
      expect(htmlArg).toContain('30');
    });
  });
});
