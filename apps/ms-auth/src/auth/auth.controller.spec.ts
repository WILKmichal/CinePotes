import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { HttpStatus, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../../../be-bg/src/auth/auth.guard';

const mockAuthService = { signIn: jest.fn() };
const mockUsersService = {
  createUser: jest.fn(),
  confirmEmail: jest.fn(),
  issuePasswordResetToken: jest.fn(),
  resetPasswordWithToken: jest.fn(),
  findProfileById: jest.fn(),
  updateProfileNom: jest.fn(),
  deleteAccount: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'RESET_PASSWORD_EXPIRES_MINUTES') return '30';
    if (key === 'FRONT_RESET_PASSWORD_URL') return 'http://localhost:3000/reset-password';
    return undefined;
  }),
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
        { provide: ConfigService, useValue: mockConfigService },
        { provide: 'NATS_SERVICE', useValue: mockNatsClient },
      ],
    })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: () => true })
    .compile();
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

  /* REGISTER — sans role */
  it('should register user with provided nom', async () => {
    mockUsersService.createUser.mockResolvedValue({ email: 'test@test.com', email_verification_token: 'token' });
    const result = await controller.register({ email: 'test@test.com', password: 'Password123!', nom: 'Test' });
    expect(mockUsersService.createUser).toHaveBeenCalledWith('Test', 'test@test.com', 'Password123!');
    expect(result.status).toBe(HttpStatus.CREATED);
  });

  it('should use email prefix as nom when nom is undefined', async () => {
    mockUsersService.createUser.mockResolvedValue({ email: 'john@test.com', email_verification_token: 'token' });
    await controller.register({ email: 'john@test.com', password: 'Password123!' } as any);
    expect(mockUsersService.createUser).toHaveBeenCalledWith('john', 'john@test.com', 'Password123!');
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

  /* FORGOT PASSWORD */
  it('should send reset email if token is generated', async () => {
    mockUsersService.issuePasswordResetToken.mockResolvedValue('TOKEN123');
    const res = await controller.forgotPassword({ email: 'mehdi@gmail.com' });
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

  /* ME */
  it('should return user profile on meById', async () => {
    const mockUser = { id: 'u1', nom: 'Mehdi', email: 'mehdi@test.com', email_verifie: true, cree_le: new Date() };
    mockUsersService.findProfileById.mockResolvedValue(mockUser);
    const result = await controller.meById({ userId: 'u1' });
    expect(mockUsersService.findProfileById).toHaveBeenCalledWith('u1');
    expect(result).toEqual(mockUser);
  });

  it('should trim and update name on updateName', async () => {
    const updatedUser = { id: 'u1', nom: 'NouveauNom', email: 'mehdi@test.com', email_verifie: true, cree_le: new Date() };
    mockUsersService.updateProfileNom.mockResolvedValue(updatedUser);
    const result = await controller.updateName({ userId: 'u1', nom: '   NouveauNom   ' });
    expect(mockUsersService.updateProfileNom).toHaveBeenCalledWith('u1', 'NouveauNom');
    expect(result).toEqual(updatedUser);
  });

  /* DELETE */
  it('should delete account on deleteMe', async () => {
    mockUsersService.deleteAccount.mockResolvedValue(true);
    const result = await controller.deleteMe({ userId: 'u1' });
    expect(mockUsersService.deleteAccount).toHaveBeenCalledWith('u1');
    expect(mockNatsClient.emit).toHaveBeenCalledWith('user.deleted', { userId: 'u1' });
    expect(result).toEqual({ message: 'Compte supprimé avec succès' });
  });

  it('should throw UnauthorizedException when deleting unknown user', async () => {
    mockUsersService.deleteAccount.mockResolvedValue(false);
    await expect(controller.deleteMe({ userId: 'unknown' })).rejects.toThrow(UnauthorizedException);
    expect(mockNatsClient.emit).not.toHaveBeenCalled();
  });
});