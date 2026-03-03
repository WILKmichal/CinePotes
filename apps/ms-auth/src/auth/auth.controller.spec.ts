import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { HttpStatus, BadRequestException } from '@nestjs/common';

const mockAuthService = { signIn: jest.fn() };
const mockUsersService = {
  createUser: jest.fn(),
  confirmEmail: jest.fn(),
  issuePasswordResetToken: jest.fn(),
  resetPasswordWithToken: jest.fn(),
};
const mockNatsClient = { emit: jest.fn() };

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: 'NATS_SERVICE', useValue: mockNatsClient },
      ],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => { process.env.VERIFICATION_MAIL = 'false'; });

  it('should be defined', () => { expect(controller).toBeDefined(); });

  /* LOGIN */
  it('should return access token on login', async () => {
    mockAuthService.signIn.mockResolvedValue({ access_token: 'jwt-token' });
    const result = await controller.login({ username: 'test@example.com', password: 'Password123!' });
    expect(result).toEqual({ access_token: 'jwt-token' });
  });

  it('should propagate login error', async () => {
    mockAuthService.signIn.mockRejectedValue(new Error('Unauthorized'));
    await expect(controller.login({ username: 'test@example.com', password: 'bad' })).rejects.toThrow();
  });

  /* REGISTER */
  it('should register user with provided nom and role', async () => {
    mockUsersService.createUser.mockResolvedValue({ email: 'test@test.com', email_verification_token: 'token' });
    const result = await controller.register({ email: 'test@test.com', password: 'Password123!', nom: 'Test', role: 'admin' });
    expect(mockUsersService.createUser).toHaveBeenCalledWith('Test', 'test@test.com', 'Password123!', 'admin');
    expect(result.status).toBe(HttpStatus.CREATED);
  });

  it('should use email prefix as nom when nom is undefined', async () => {
    mockUsersService.createUser.mockResolvedValue({ email: 'john@test.com', email_verification_token: 'token' });
    await controller.register({ email: 'john@test.com', password: 'Password123!', role: 'user' } as any);
    expect(mockUsersService.createUser).toHaveBeenCalledWith('john', 'john@test.com', 'Password123!', 'user');
  });

  /* CONFIRM EMAIL */
  it('should return success false when confirmation fails', async () => {
    mockUsersService.confirmEmail.mockResolvedValue(false);
    const result = await controller.confirmEmail({ token: 'bad' });
    expect(result).toEqual({ success: false, message: 'Lien invalide ou expiré' });
  });

  it('should return success true when confirmation succeeds', async () => {
    mockUsersService.confirmEmail.mockResolvedValue(true);
    const result = await controller.confirmEmail({ token: 'good' });
    expect(result).toEqual({ success: true });
  });

  /* FORGOT PASSWORD  */
  it('should send reset email if token is generated', async () => {
    mockUsersService.issuePasswordResetToken.mockResolvedValue('TOKEN123');
    const res = await controller.forgotPassword({ email: 'mehdi@gmail.com', expiresInMinutes: 30 });
    expect(mockUsersService.issuePasswordResetToken).toHaveBeenCalledWith('mehdi@gmail.com', 30);
    expect(mockNatsClient.emit).toHaveBeenCalledWith('notif.reset-password', expect.objectContaining({ email: 'mehdi@gmail.com', resetUrl: expect.stringContaining('TOKEN123') }));
    expect(res.message).toBeDefined();
  });

  it('should NOT send reset email if no token', async () => {
    mockUsersService.issuePasswordResetToken.mockResolvedValue(null);
    await controller.forgotPassword({ email: 'unknown@gmail.com' });
    expect(mockNatsClient.emit).not.toHaveBeenCalled();
  });

  /* RESET PASSWORD */
  it('should return success message on valid token', async () => {
    mockUsersService.resetPasswordWithToken.mockResolvedValue(true);
    const res = await controller.resetPassword({ token: 'valid', newPassword: 'NewPass123!' });
    expect(res).toEqual({ message: 'Mot de passe réinitialisé avec succès' });
  });

  it('should throw BadRequestException on invalid token', async () => {
    mockUsersService.resetPasswordWithToken.mockResolvedValue(false);
    await expect(controller.resetPassword({ token: 'bad', newPassword: 'x' })).rejects.toThrow(BadRequestException);
  });
});
