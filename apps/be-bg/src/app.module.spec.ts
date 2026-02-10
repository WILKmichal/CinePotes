import { DataSource } from 'typeorm';
import { AppModule } from './app.module';

describe('AppModule', () => {
  let appModule: AppModule;
  let mockQuery: jest.Mock;

  beforeEach(async () => {
    mockQuery = jest.fn().mockResolvedValue(undefined);

    const mockDataSource = {
      query: mockQuery,
    };

    // Skip Test.createTestingModule - just instantiate AppModule directly
    appModule = new AppModule(mockDataSource as unknown as DataSource);
  });

  afterEach(async () => {
    // cleanup if needed
  });

  describe('onModuleInit', () => {
    it('should successfully create uuid-ossp extension', async () => {
      await appModule.onModuleInit();

      expect(mockQuery).toHaveBeenCalledWith(
        'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
      );
    });

    it('should throw error when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      mockQuery.mockRejectedValueOnce(dbError);

      await expect(appModule.onModuleInit()).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should verify extension query syntax', async () => {
      mockQuery.mockClear();
      mockQuery.mockResolvedValue(undefined);

      await appModule.onModuleInit();

      const [query] = mockQuery.mock.calls[0];
      expect(query).toBe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    });
  });

  describe('module instantiation', () => {
    it('should create AppModule instance', () => {
      expect(appModule).toBeDefined();
      expect(appModule).toBeInstanceOf(AppModule);
    });

    it('should have DataSource injected', () => {
      expect(appModule['dataSource']).toBeDefined();
    });
  });
});
