import { validateEnvironmentVariables } from './config.validation';

describe('validateEnvironmentVariables', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  // Quand toutes les variables sont presentes, pas d'erreur
  it('should not exit when all required variables are set', () => {
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASSWORD = 'password';

    validateEnvironmentVariables();

    expect(process.exit).not.toHaveBeenCalled();
  });

  // Quand des variables SMTP manquent, on exit
  it('should exit when SMTP variables are missing', () => {
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;

    validateEnvironmentVariables();

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  // Quand REDIS manque, on exit
  it('should exit when Redis variables are missing', () => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASSWORD = 'password';

    validateEnvironmentVariables();

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  // Verifie que toutes les variables manquantes sont listees
  it('should list all missing variables in error message', () => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;

    validateEnvironmentVariables();

    const errorCalls = (console.error as jest.Mock).mock.calls.flat().join(' ');
    expect(errorCalls).toContain('REDIS_HOST');
    expect(errorCalls).toContain('SMTP_HOST');
    expect(errorCalls).toContain('SMTP_USER');
  });
});
