import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../../../ms-mail/src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { HttpStatus, BadRequestException } from '@nestjs/common';

const mockAuthService = {
  signIn: jest.fn(),
};

const mockUsersService = {
  createUser: jest.fn(),
  confirmEmail: jest.fn(),
  issuePasswordResetToken: jest.fn(),
  resetPasswordWithToken: jest.fn(),
};

const mockMailService = {
  sendEmail: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'RESET_PASSWORD_EXPIRES_MINUTES') return '30';
      if (key === 'FRONT_RESET_PASSWORD_URL')
        return 'http://localhost:3000/reset-password';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    process.env.VERIFICATION_MAIL = 'false';
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /* ================= LOGIN ================= */

  it('should return access token on login', async () => {
    mockAuthService.signIn.mockResolvedValue({ access_token: 'jwt-token' });

    const result = await controller.login({
      username: 'test@example.com',
      password: 'Password123!',
    });

    expect(result).toEqual({ access_token: 'jwt-token' });
  });

  it('should propagate login error', async () => {
    mockAuthService.signIn.mockRejectedValue(new Error('Unauthorized'));

    await expect(
      controller.login({
        username: 'test@example.com',
        password: 'bad',
      }),
    ).rejects.toThrow();
  });

  /* ================= REGISTER ================= */

  it('should register user with provided nom and role', async () => {
    mockUsersService.createUser.mockResolvedValue({
      email: 'test@test.com',
      email_verification_token: 'token',
    });

    const result = await controller.register({
      email: 'test@test.com',
      password: 'Password123!',
      nom: 'Test',
      role: 'admin',
    });

    expect(mockUsersService.createUser).toHaveBeenCalledWith(
      'Test',
      'test@test.com',
      'Password123!',
      'admin',
    );

    expect(result.status).toBe(HttpStatus.CREATED);
  });

  it('should use email prefix as nom when nom is undefined', async () => {
    mockUsersService.createUser.mockResolvedValue({
      email: 'john@test.com',
      email_verification_token: 'token',
    });

    await controller.register({
      email: 'john@test.com',
      password: 'Password123!',
      role: 'user',
    } as any);

    expect(mockUsersService.createUser).toHaveBeenCalledWith(
      'john',
      'john@test.com',
      'Password123!',
      'user',
    );
  });

  it('should throw if user creation fails', async () => {
    mockUsersService.createUser.mockRejectedValue(new Error('DB error'));

    await expect(
      controller.register({
        email: 'fail@test.com',
        password: 'Password123!',
        nom: 'Fail',
        role: 'user',
      }),
    ).rejects.toThrow();
  });




  /* ================= CONFIRM EMAIL ================= */

  it('should return 400 when email confirmation fails', async () => {
    mockUsersService.confirmEmail.mockResolvedValue(false);

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      redirect: jest.fn(),
    };

    await controller.confirmEmail('bad-token', res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Lien invalide ou expiré');
  });

  it('should redirect when email confirmation succeeds', async () => {
    mockUsersService.confirmEmail.mockResolvedValue(true);

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      redirect: jest.fn(),
    };

    await controller.confirmEmail('good-token', res as any);

    expect(res.redirect).toHaveBeenCalled();
  });

  /* ================= FORGOT PASSWORD ================= */

  it('should send reset email if token is generated', async () => {
    mockUsersService.issuePasswordResetToken.mockResolvedValue('TOKEN123');

    const res = await controller.forgotPassword('mehdi@gmail.com');

    expect(mockUsersService.issuePasswordResetToken).toHaveBeenCalledWith(
      'mehdi@gmail.com',
      30,
    );

    expect(mockMailService.sendEmail).toHaveBeenCalledWith(
      'mehdi@gmail.com',
      'Réinitialisation de votre mot de passe',
      expect.stringContaining('TOKEN123'),
    );

    expect(res).toEqual({
      message:
        'Si un compte existe avec cette adresse mail, un email a été envoyé',
    });
  });

  it("should NOT send reset email if no token returned", async () => {
    mockUsersService.issuePasswordResetToken.mockResolvedValue(null);

    await controller.forgotPassword('unknown@gmail.com');

    expect(mockMailService.sendEmail).not.toHaveBeenCalled();
  });

  /* ================= RESET PASSWORD ================= */

  it('should return success if resetPasswordWithToken returns true', async () => {
    mockUsersService.resetPasswordWithToken.mockResolvedValue(true);

    const res = await controller.resetPassword({
      token: 'valid',
      newPassword: 'NewPass123!',
    });

    expect(mockUsersService.resetPasswordWithToken).toHaveBeenCalledWith(
      'valid',
      'NewPass123!',
    );

    expect(res).toEqual({
      message: 'Mot de passe réinitialisé avec succès',
    });
  });

  it('should throw BadRequestException if resetPasswordWithToken returns false', async () => {
    mockUsersService.resetPasswordWithToken.mockResolvedValue(false);

    await expect(
      controller.resetPassword({
        token: 'bad',
        newPassword: 'x',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
