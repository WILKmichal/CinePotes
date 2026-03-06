import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
    } as unknown as ConfigService;
    strategy = new JwtStrategy(configService);
  });

  it('should return payload when validate is called', () => {
    const payload = { sub: 1, email: 'test@test.com' };
    expect(strategy.validate(payload)).toEqual(payload);
  });
});
