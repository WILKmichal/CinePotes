import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { MailAdapter } from 'src/mail/mail.adapter';
import { BadRequestException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

describe('AuthController forgot-password (mocks)', () => {
  let controller: AuthController;

  const usersServiceMock = {
    issuePasswordResetToken: jest.fn(),
    resetPasswordWithToken: jest.fn(),
  };

  const authServiceMock = {
    signIn: jest.fn(),
  };

  const mailAdapterMock = {
    sendResetPasswordEmail: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    configServiceMock.get.mockImplementation((key: string) => {
      if (key === 'RESET_PASSWORD_EXPIRES_MINUTES') return '30';
      if (key === 'FRONT_RESET_PASSWORD_URL')
        return 'http://localhost:3000/reset-password';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: ConfigService, useValue: configServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: MailAdapter, useValue: mailAdapterMock },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('envoie un mail si un token est généré', async () => {
    usersServiceMock.issuePasswordResetToken.mockResolvedValue('TOKEN123');

    const res = await controller.forgotPassword('mehdi@gmail.com');

    expect(usersServiceMock.issuePasswordResetToken).toHaveBeenCalledWith(
      'mehdi@gmail.com',
      30,
    );

    expect(mailAdapterMock.sendResetPasswordEmail).toHaveBeenCalledTimes(1);
    expect(mailAdapterMock.sendResetPasswordEmail).toHaveBeenCalledWith({
      email: 'mehdi@gmail.com',
      resetUrl: 'http://localhost:3000/reset-password?token=TOKEN123',
      expiresInMinutes: 30,
    });

    expect(res).toEqual({
      message:
        'Si un compte existe avec cette adresse mail, un email a été envoyé',
    });
  });

  it("n'envoie PAS de mail si aucun token (email inconnu)", async () => {
    usersServiceMock.issuePasswordResetToken.mockResolvedValue(null);

    await controller.forgotPassword('unknown@gmail.com');

    expect(mailAdapterMock.sendResetPasswordEmail).not.toHaveBeenCalled();
  });
});

describe('AuthController reset-password (mocks)', () => {
  let controller: AuthController;

  const usersServiceMock = {
    issuePasswordResetToken: jest.fn(),
    resetPasswordWithToken: jest.fn(),
  };

  const authServiceMock = {
    signIn: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: AuthService, useValue: authServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: MailAdapter, useValue: { sendResetPasswordEmail: jest.fn() } },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('retourne succès si resetPasswordWithToken retourne true', async () => {
    usersServiceMock.resetPasswordWithToken.mockResolvedValue(true);

    const res = await controller.resetPassword({
      token: 'valid',
      newPassword: 'NewPass123!',
    });

    expect(usersServiceMock.resetPasswordWithToken).toHaveBeenCalledWith(
      'valid',
      'NewPass123!',
    );
    expect(res).toEqual({ message: 'Mot de passe réinitialisé avec succès' });
  });

  it('lève BadRequestException si resetPasswordWithToken retourne false', async () => {
    usersServiceMock.resetPasswordWithToken.mockResolvedValue(false);

    await expect(
      controller.resetPassword({ token: 'bad', newPassword: 'x' }),
    ).rejects.toThrow(BadRequestException);
  });
});
