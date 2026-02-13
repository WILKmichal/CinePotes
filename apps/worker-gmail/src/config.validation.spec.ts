import { validateEnvironmentVariables } from './config.validation';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };

  jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
    throw new Error(`process.exit called with code ${code}`);
  });

  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('validateEnvironmentVariables', () => {
  // Tout est la, on ne doit pas crash
  it('does nothing when all required variables are present', () => {
    process.env = {
      ...process.env,
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      SMTP_USER: 'test@test.com',
      SMTP_PASSWORD: 'password',
    };
    expect(() => validateEnvironmentVariables()).not.toThrow();
    expect(process.exit).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  // Variable manquante = exit(1) + message d'erreur
  it('logs errors and exits when a required variable is missing', () => {
    process.env = {
      ...process.env,
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      // SMTP_HOST manquant
    };

    expect(() => validateEnvironmentVariables()).toThrow(
      'process.exit called with code 1',
    );
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
