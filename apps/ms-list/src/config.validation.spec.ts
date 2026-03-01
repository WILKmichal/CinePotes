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
      NATS_URL: 'nats://localhost:4222',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
      DB_NAME: 'cinepotes',
    };
    expect(() => validateEnvironmentVariables()).not.toThrow();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(process.exit).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  // Variable manquante = exit(1) + message d'erreur
  it('logs errors and exits when a required variable is missing', () => {
    process.env = {
      ...process.env,
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      // NATS_URL manquant
    };

    expect(() => validateEnvironmentVariables()).toThrow(
      'process.exit called with code 1',
    );
    expect(console.error).toHaveBeenCalledTimes(2);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
