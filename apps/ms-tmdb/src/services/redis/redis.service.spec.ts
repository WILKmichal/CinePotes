import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('RedisService', () => {
  let service: RedisService;
  let redisClient: InstanceType<typeof Redis>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get(RedisService);
    service.onModuleInit();

    redisClient = (Redis as unknown as jest.Mock).mock.results[0]
      .value as InstanceType<typeof Redis>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('get() should return parsed value', async () => {
    const value = { ok: true };

    jest.spyOn(redisClient, 'get').mockResolvedValue(JSON.stringify(value));

    const result = await service.get<typeof value>('test');

    expect(result).toEqual(value);
  });

  it('get() should return null if key does not exist', async () => {
    jest.spyOn(redisClient, 'get').mockResolvedValue(null);

    const result = await service.get('missing');

    expect(result).toBeNull();
  });

  it('set() should save value with ttl', async () => {
    const data = { hello: 'redis' };

    const setSpy = jest.spyOn(redisClient, 'set').mockResolvedValue('OK');

    await service.set('key', data, 120);

    expect(setSpy).toHaveBeenCalledWith('key', JSON.stringify(data), 'EX', 120);
  });
});
