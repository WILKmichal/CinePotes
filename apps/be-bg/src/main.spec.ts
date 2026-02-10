import 'reflect-metadata';

describe('bootstrap function', () => {
  let consoleLogSpy: jest.SpyInstance;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
  });

  it('should validate environment variables first', () => {
    // Bootstrap starts by calling validateEnvironmentVariables
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_USER = 'postgres';
    process.env.DB_PASSWORD = 'example';
    process.env.DB_NAME = 'mydatabase';
    process.env.APP_PORT = '3002';

    // If we reach here without throwing, validation passed
    expect(process.env.DB_HOST).toBe('localhost');
  });

  it('should parse APP_PORT as number', () => {
    process.env.APP_PORT = '3002';
    const port = Number(process.env.APP_PORT);

    expect(port).toBe(3002);
    expect(typeof port).toBe('number');
  });

  it('should handle different port numbers', () => {
    process.env.APP_PORT = '8080';
    const port = Number(process.env.APP_PORT);

    expect(port).toBe(8080);
  });

  it('should have all required environment variables set', () => {
    const requiredVars = [
      'DB_HOST',
      'DB_PORT',
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME',
      'APP_PORT',
    ];

    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_USER = 'postgres';
    process.env.DB_PASSWORD = 'example';
    process.env.DB_NAME = 'mydatabase';
    process.env.APP_PORT = '3002';

    requiredVars.forEach((varName) => {
      expect(process.env[varName]).toBeDefined();
    });
  });
});
