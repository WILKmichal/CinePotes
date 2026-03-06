import { envValidationSchema } from './config.validation';

describe('envValidationSchema', () => {
  it('accepts a valid environment payload', () => {
    const result = envValidationSchema.validate({
      NATS_URL: 'nats://localhost:4222',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
      DB_NAME: 'cinepotes',
    });

    expect(result.error).toBeUndefined();
  });

  it('fails when required variables are missing', () => {
    const result = envValidationSchema.validate({
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'postgres',
    });

    expect(result.error).toBeDefined();
    expect(result.error?.details.some((detail) => detail.path.includes('NATS_URL'))).toBe(true);
  });
});
