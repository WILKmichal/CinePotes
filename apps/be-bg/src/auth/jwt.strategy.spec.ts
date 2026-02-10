import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  it('should return payload when validate is called', () => {
    const payload = {
      sub: 1,
      email: 'test@test.com',
    };

    // couvre la seule méthode
    expect(strategy.validate(payload)).toEqual(payload);
  });
});
