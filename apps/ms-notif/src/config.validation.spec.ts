import { validateEnvironmentVariables } from './config.validation';

describe('validateEnvironmentVariables', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Copie propre de l'env pour chaque test
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
    process.env.NATS_URL = 'nats://localhost:4222';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';

    validateEnvironmentVariables();

    expect(process.exit).not.toHaveBeenCalled();
  });

  // Quand NATS_URL manque, on exit avec un message
  it('should exit when NATS_URL is missing', () => {
    delete process.env.NATS_URL;
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';

    validateEnvironmentVariables();

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalled();
  });

  // Quand REDIS_HOST manque, on exit avec un message
  it('should exit when REDIS_HOST is missing', () => {
    process.env.NATS_URL = 'nats://localhost:4222';
    delete process.env.REDIS_HOST;
    process.env.REDIS_PORT = '6379';

    validateEnvironmentVariables();

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  // Quand plusieurs variables manquent, on les liste toutes
  it('should list all missing variables', () => {
    delete process.env.NATS_URL;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;

    validateEnvironmentVariables();

    expect(process.exit).toHaveBeenCalledWith(1);
    // Verifie qu'on affiche les 3 variables manquantes
    const errorCalls = (console.error as jest.Mock).mock.calls.flat().join(' ');
    expect(errorCalls).toContain('NATS_URL');
    expect(errorCalls).toContain('REDIS_HOST');
    expect(errorCalls).toContain('REDIS_PORT');
  });
});
