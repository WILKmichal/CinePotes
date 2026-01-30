import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(() => {
    guard = new AuthGuard(mockJwtService as unknown as JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return true when user is attached to request', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 1 },
          headers: {
            authorization: 'Bearer token',
          },
        }),
      }),
    };

    mockJwtService.verifyAsync.mockResolvedValue({ sub: 1 });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should return false when no authorization header', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    };

    expect(await guard.canActivate(context)).toBe(false);
  });

  it('should return false when jwt verification fails', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer badtoken',
          },
        }),
      }),
    };

    mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    expect(await guard.canActivate(context)).toBe(false);
  });
});
