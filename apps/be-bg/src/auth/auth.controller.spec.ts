import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../../../ms-mail/src/mail/mail.service';
import { HttpStatus } from '@nestjs/common';

const mockAuthService = {
  signIn: jest.fn(),
};

const mockUsersService = {
  createUser: jest.fn(),
  confirmEmail: jest.fn(),
};

const mockMailService = {
  sendEmail: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   * ==========================
   * LOGIN
   * ==========================
   */

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

  /**
   * ==========================
   * REGISTER
   * ==========================
   */

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

  it('should default role to user when role is undefined', async () => {
    mockUsersService.createUser.mockResolvedValue({
      email: 'test@test.com',
      email_verification_token: 'token',
    });

    await controller.register({
      email: 'test@test.com',
      password: 'Password123!',
      nom: 'Test',
    } as any);

    expect(mockUsersService.createUser).toHaveBeenCalledWith(
      'Test',
      'test@test.com',
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

  it('should NOT send email when NODE_ENV is test', async () => {
    mockUsersService.createUser.mockResolvedValue({
      email: 'test@test.com',
      email_verification_token: 'token',
    });

    await controller.register({
      email: 'test@test.com',
      password: 'Password123!',
      nom: 'Test',
      role: 'user',
    });

    expect(mockMailService.sendEmail).not.toHaveBeenCalled();
  });

  it('should send confirmation email in production', async () => {
    process.env.NODE_ENV = 'production';

    mockUsersService.createUser.mockResolvedValue({
      email: 'test@test.com',
      email_verification_token: 'token',
    });

    mockMailService.sendEmail.mockResolvedValue(undefined);

    const result = await controller.register({
      email: 'test@test.com',
      password: 'Password123!',
      nom: 'Test',
      role: 'user',
    });

    expect(mockMailService.sendEmail).toHaveBeenCalled();
    expect(result.status).toBe(HttpStatus.CREATED);
  });

  it('should handle undefined email_verification_token', async () => {
    process.env.NODE_ENV = 'production';

    mockUsersService.createUser.mockResolvedValue({
      email: 'test@test.com',
      email_verification_token: undefined,
    });

    mockMailService.sendEmail.mockResolvedValue(undefined);

    await controller.register({
      email: 'test@test.com',
      password: 'Password123!',
      nom: 'Test',
      role: 'user',
    });

    expect(mockMailService.sendEmail).toHaveBeenCalled();
  });

  /**
   * ==========================
   * CONFIRM EMAIL
   * ==========================
   */

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
    expect(res.redirect).not.toHaveBeenCalled();
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
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });
});
