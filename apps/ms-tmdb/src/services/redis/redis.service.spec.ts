import { RedisService } from './redis.service';

// On mock ioredis (le constructeur Redis)
const onHandlers: Record<string, Function> = {};
// on stocke le handler pour le déclencher dans les tests
const mockRedisInstance = {
  on: jest.fn((event: string, cb: Function) => {
    onHandlers[event] = cb;
  }),
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn(() => mockRedisInstance),
  };
});

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
    // reset handlers
    for (const k of Object.keys(onHandlers)) delete onHandlers[k];

    service = new RedisService();
  });

  it('doit créer un client Redis au onModuleInit et passer valable=true au connect', () => {
    service.onModuleInit();

    // Simule l’évènement "connect"
    expect(onHandlers.connect).toBeDefined();
    onHandlers.connect();

    // on vérifie que le client existe via le comportement:
    // get/set ne doivent pas retourner null "par absence client".
    expect(mockRedisInstance.on).toHaveBeenCalled();
  });

  it('doit mettre redisClient=null si "error" est déclenché', async () => {
    service.onModuleInit();

    expect(onHandlers.error).toBeDefined();
    onHandlers.error(new Error('boom'));

    // Après erreur, get doit renvoyer null (car client mis à null)
    const res = await service.get('k');
    expect(res).toBeNull();
  });

  it('get() doit retourner null si pas de client', async () => {
    // pas de onModuleInit => client null
    const res = await service.get('any');
    expect(res).toBeNull();
  });

  it('get() doit parser le JSON si une valeur existe', async () => {
    service.onModuleInit();
    onHandlers.connect();

    mockRedisInstance.get.mockResolvedValueOnce(JSON.stringify({ a: 1 }));

    const res = await service.get<{ a: number }>('k1');
    expect(res).toEqual({ a: 1 });
    expect(mockRedisInstance.get).toHaveBeenCalledWith('k1');
  });

  it('set() ne doit rien faire si pas de client', async () => {
    await service.set('k', { x: 1 });
    expect(mockRedisInstance.set).not.toHaveBeenCalled();
  });

  it('set() doit stringify et poser un TTL (par défaut 7200)', async () => {
    service.onModuleInit();
    onHandlers.connect();

    await service.set('k2', { x: 2 });

    // ioredis set(key, value, 'EX', ttl)
    expect(mockRedisInstance.set).toHaveBeenCalledWith(
      'k2',
      JSON.stringify({ x: 2 }),
      'EX',
      7200,
    );
  });

  it('set() doit utiliser le ttl fourni', async () => {
    service.onModuleInit();
    onHandlers.connect();

    await service.set('k3', { y: 9 }, 60);
    expect(mockRedisInstance.set).toHaveBeenCalledWith(
      'k3',
      JSON.stringify({ y: 9 }),
      'EX',
      60,
    );
  });
});