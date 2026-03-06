import { AuthGuard } from './auth.guard';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockNatsClient = {
    send: jest.fn(),
  };

  beforeEach(() => {
    // eslint-disable-next-line no-console
    guard = new AuthGuard(mockNatsClient as unknown as ClientProxy);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return true when token is verified successfully', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer validtoken',
          },
        }),
      }),
    };

    mockNatsClient.send.mockReturnValue(of({ sub: '123', username: 'test@example.com' }));

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should throw when no authorization header', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    };

    await expect(guard.canActivate(context)).rejects.toThrow();
  });

  it('should throw when token verification fails', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer badtoken',
          },
        }),
      }),
    };

    mockNatsClient.send.mockReturnValue(throwError(() => new Error('Invalid token')));

    await expect(guard.canActivate(context)).rejects.toThrow();
  });
});
