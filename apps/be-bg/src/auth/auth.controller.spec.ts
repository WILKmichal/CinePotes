import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AuthGuard } from './auth.guard';

const mockNatsClient = {
  send: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};
const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: 'NATS_SERVICE', useValue: mockNatsClient },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /* ================= LOGIN ================= */

  it('should return access token on login', async () => {
    mockNatsClient.send.mockReturnValue(
      of({ access_token: 'jwt-token' }),
    );

    const result = await controller.login({
      username: 'test@example.com',
      password: 'Password123!',
    });

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'auth.login',
      {
        username: 'test@example.com',
        password: 'Password123!',
      },
    );

    expect(result).toEqual({ access_token: 'jwt-token' });
  });

  it('should propagate login error', async () => {
    mockNatsClient.send.mockReturnValue(
      throwError(() => ({
        message: 'Unauthorized',
        statusCode: 401,
      })),
    );

    await expect(
      controller.login({
        username: 'test@example.com',
        password: 'bad',
      }),
    ).rejects.toThrow(HttpException);
  });

  // ✅ AJOUT — couvre la branche fallback quand l'erreur n'a pas de message
  it('should throw HttpException with fallback message when login error has no message', async () => {
    mockNatsClient.send.mockReturnValue(throwError(() => ({})));

    await expect(
      controller.login({ username: 'test@example.com', password: 'bad' }),
    ).rejects.toThrow(HttpException);
  });

  /* ================= REGISTER ================= */

  it('should register user', async () => {
    mockNatsClient.send.mockReturnValue(
      of({ message: 'User created' }),
    );

    const body = {
      email: 'test@test.com',
      password: 'Password123!',
      nom: 'Test',
    };

    const result = await controller.register(body);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'auth.register',
      body,
    );

    expect(result).toEqual({ message: 'User created' });
  });

  it('should propagate register error', async () => {
    mockNatsClient.send.mockReturnValue(
      throwError(() => ({
        message: 'Erreur inscription',
        statusCode: 400,
      })),
    );

    await expect(
      controller.register({
        email: 'fail@test.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow(HttpException);
  });

  // ✅ AJOUT — couvre la branche fallback du catch register
  it('should throw HttpException with fallback message when register error has no message', async () => {
    mockNatsClient.send.mockReturnValue(throwError(() => ({})));

    await expect(
      controller.register({ email: 'fail@test.com', password: 'Password123!' }),
    ).rejects.toThrow(HttpException);
  });

  /* ================= CONFIRM EMAIL ================= */

  it('should return 400 when email confirmation fails', async () => {
    mockNatsClient.send.mockReturnValue(
      of({ success: false }),
    );

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      redirect: jest.fn(),
    };

    await controller.confirmEmail('bad-token', res as any);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'auth.confirm-email',
      { token: 'bad-token' },
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Lien invalide ou expiré');
  });

  it('should redirect when email confirmation succeeds', async () => {
    mockNatsClient.send.mockReturnValue(
      of({ success: true }),
    );

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      redirect: jest.fn(),
    };

    await controller.confirmEmail('good-token', res as any);

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'auth.confirm-email',
      { token: 'good-token' },
    );

    expect(res.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/?redirect=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fcallback',
    );
  });

  it('should return 400 if confirmEmail throws', async () => {
    mockNatsClient.send.mockReturnValue(
      throwError(() => new Error()),
    );

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      redirect: jest.fn(),
    };

    await controller.confirmEmail('error-token', res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Lien invalide ou expiré');
  });

  /* ================= FORGOT PASSWORD ================= */

  it('should call forgot-password with correct payload', async () => {
    mockNatsClient.send.mockReturnValue(
      of({
        message:
          'Si un compte existe avec cette adresse mail, un email a été envoyé',
      }),
    );

    const result = await controller.forgotPassword('mehdi@gmail.com');

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'auth.forgot-password',
      {
        email: 'mehdi@gmail.com',
      },
    );

    expect(result).toEqual({
      message:
        'Si un compte existe avec cette adresse mail, un email a été envoyé',
    });
  });

  /* ================= RESET PASSWORD ================= */

  it('should reset password successfully', async () => {
    mockNatsClient.send.mockReturnValue(
      of({ message: 'Mot de passe réinitialisé avec succès' }),
    );

    const result = await controller.resetPassword({
      token: 'valid',
      newPassword: 'NewPass123!',
    });

    expect(mockNatsClient.send).toHaveBeenCalledWith(
      'auth.reset-password',
      {
        token: 'valid',
        newPassword: 'NewPass123!',
      },
    );

    expect(result).toEqual({
      message: 'Mot de passe réinitialisé avec succès',
    });
  });

  it('should throw HttpException if reset fails', async () => {
    mockNatsClient.send.mockReturnValue(
      throwError(() => ({
        message: 'Lien invalide ou expiré',
        statusCode: HttpStatus.BAD_REQUEST,
      })),
    );

    await expect(
      controller.resetPassword({
        token: 'bad',
        newPassword: 'x',
      }),
    ).rejects.toThrow(HttpException);
  });

  // ✅ AJOUT — couvre le fallback de handleError quand l'erreur n'a pas de message
  it('should throw HttpException with fallback when reset error has no message', async () => {
    mockNatsClient.send.mockReturnValue(throwError(() => ({})));

    await expect(
      controller.resetPassword({ token: 'bad', newPassword: 'x' }),
    ).rejects.toThrow(HttpException);
  });

  /* ================= ME ================= */

  it('should return current user profile on me()', async () => {
    mockNatsClient.send.mockReturnValue(
      of({
        id: 'u1',
        nom: 'Mehdi',
        email: 'mehdi@test.com',
        role: 'user',
        email_verifie: true,
        cree_le: '2026-03-02T00:00:00.000Z',
      }),
    );

    const req = { user: { sub: 'u1' } };
    const result = await controller.me(req);

    expect(mockNatsClient.send).toHaveBeenCalledWith('auth.me', { userId: 'u1' });
    expect(result).toEqual({
      id: 'u1',
      nom: 'Mehdi',
      email: 'mehdi@test.com',
      role: 'user',
      email_verifie: true,
      cree_le: '2026-03-02T00:00:00.000Z',
    });
  });

  /* ================= UPDATE ME ================= */

  it('should update user name on updateMe()', async () => {
    mockNatsClient.send.mockReturnValue(
      of({
        id: 'u1',
        nom: 'NouveauNom',
        email: 'mehdi@test.com',
        role: 'user',
        email_verifie: true,
        cree_le: '2026-03-02T00:00:00.000Z',
      }),
    );

    const req = { user: { sub: 'u1' } };
    const body = { nom: '   NouveauNom   ' };

    const result = await controller.updateMe(req, body);

    expect(mockNatsClient.send).toHaveBeenCalledWith('auth.update-name', {
      userId: 'u1',
      nom: 'NouveauNom',
    });

    expect(result).toEqual({
      id: 'u1',
      nom: 'NouveauNom',
      email: 'mehdi@test.com',
      role: 'user',
      email_verifie: true,
      cree_le: '2026-03-02T00:00:00.000Z',
    });
  });

  // ✅ AJOUT — couvre la branche throw quand nom est vide (ligne 235)
  it('should throw HttpException when nom is empty on updateMe()', async () => {
    await expect(
      controller.updateMe({ user: { sub: 'u1' } }, { nom: '   ' }),
    ).rejects.toThrow(HttpException);
    expect(mockNatsClient.send).not.toHaveBeenCalled();
  });

  it('should throw HttpException when nom is null on updateMe()', async () => {
    await expect(
      controller.updateMe({ user: { sub: 'u1' } }, { nom: null as any }),
    ).rejects.toThrow(HttpException);
    expect(mockNatsClient.send).not.toHaveBeenCalled();
  });

  /* ================= DELETE ME ================= */

  it('Doit supprimer utilisateur courant avec deleteMe()', async () => {
    mockNatsClient.send.mockReturnValue(
      of({ message: 'Compte supprimé avec succès' }),
    );

    const req = { user: { sub: 'u1' } };
    const result = await controller.deleteMe(req);

    expect(mockNatsClient.send).toHaveBeenCalledWith('auth.delete-me', { userId: 'u1' });
    expect(result).toEqual({ message: 'Compte supprimé avec succès' });
  });
});