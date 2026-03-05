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
  it('does nothing when all required variables are present', () => {
    process.env = {
      ...process.env,
      APP_PORT: '3002',
      NATS_URL: 'nats://localhost:4222',
      JWT_SECRET: 'test-secret',
    };
    expect(() => validateEnvironmentVariables()).not.toThrow();
    expect(process.exit).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('logs errors and exits when required variables are missing', () => {
    process.env = {
      ...process.env,
      // Missing all critical vars
    };

    expect(() => validateEnvironmentVariables()).toThrow(
      'process.exit called with code 1',
    );
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
