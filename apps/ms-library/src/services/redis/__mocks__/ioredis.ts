import { Redis } from 'ioredis';

/*
Remplacer la lib ioredis réelle pendant les tests.
Éviter une vraie connexion Redis.
Permettre de contrôler les retours de get, set, on avec jest.fn()
 */
const redisMock: jest.Mocked<Redis> = {
  get: jest.fn(),
  set: jest.fn(),
  on: jest.fn(),
} as unknown as jest.Mocked<Redis>;

const RedisConstructor = jest.fn(() => redisMock);

export default RedisConstructor;
export { RedisConstructor as Redis };
