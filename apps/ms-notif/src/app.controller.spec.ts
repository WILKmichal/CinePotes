import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { MailService } from './mail.service';

describe('AppController', () => {
  let controller: AppController;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: MailService,
          useValue: {
            handleConfirmEmail: jest.fn().mockResolvedValue(undefined),
            handleResetPassword: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleConfirmEmail', () => {
    it('should call mailService.handleConfirmEmail with correct params', async () => {
      const data = {
        email: 'user@test.com',
        nom: 'Jean',
        confirmUrl: 'http://localhost/confirm',
      };

      await controller.handleConfirmEmail(data as any);

      expect(mailService.handleConfirmEmail).toHaveBeenCalledWith(
        'user@test.com',
        'Jean',
        'http://localhost/confirm',
      );
    });
  });

  describe('handleResetPassword', () => {
    it('should call mailService.handleResetPassword with correct params', async () => {
      const data = {
        email: 'user@test.com',
        resetUrl: 'http://localhost/reset',
        expiresInMinutes: 30,
      };

      await controller.handleResetPassword(data as any);

      expect(mailService.handleResetPassword).toHaveBeenCalledWith(
        'user@test.com',
        'http://localhost/reset',
        30,
      );
    });
  });
});
