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

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   * ✅ LOGIN OK
   */
  it('should return access token on login', async () => {
    mockAuthService.signIn.mockResolvedValue({ access_token: 'jwt-token' });

    const result = await controller.login({
      username: 'test@example.com',
      password: 'Password123!',
    });

    expect(result.access_token).toBe('jwt-token');
  });

  /**
   * ❌ LOGIN ERROR
   */
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
   * ✅ REGISTER
   */
  it('should register user and return CREATED status', async () => {
    mockUsersService.createUser.mockResolvedValue({
      email: 'test@example.com',
      email_verification_token: 'token',
    });

    const result = await controller.register({
      email: 'test@example.com',
      password: 'Password123!',
      nom: 'Test',
      role: 'user',
    });

    expect(result.status).toBe(HttpStatus.CREATED);
    expect(result.message).toContain('Email');
  });


/**
 * ❌ REGISTER ERROR
 */
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

/**
 * ❌ CONFIRM EMAIL FAILURE
 */
it('should redirect even if email confirmation fails', async () => {
  mockUsersService.confirmEmail.mockResolvedValue(false);

  const res = {
    redirect: jest.fn(),
  };

  await controller.confirmEmail('bad-token', res as any);

  expect(res.redirect).toHaveBeenCalled();
});


/**
 * ❌ MAIL SERVICE FAILURE
 */
it('should still return CREATED even if email sending fails', async () => {
  mockUsersService.createUser.mockResolvedValue({
    email: 'test@example.com',
    email_verification_token: 'token',
  });

  mockMailService.sendEmail.mockRejectedValue(new Error('Mail error'));

  const result = await controller.register({
    email: 'test@example.com',
    password: 'Password123!',
    nom: 'Test',
    role: 'user',
  });

  expect(result.status).toBe(HttpStatus.CREATED);
});



  /**
   * ✅ CONFIRM EMAIL
   */
  it('should confirm email and redirect', async () => {
    mockUsersService.confirmEmail.mockResolvedValue(true);

    const res = {
      redirect: jest.fn(),
    };

    await controller.confirmEmail('token', res as any);

    expect(res.redirect).toHaveBeenCalled();
  });
});
