import { Redis } from 'ioredis';

const redisMock: jest.Mocked<Redis> = {
  get: jest.fn(),
  set: jest.fn(),
  on: jest.fn(),
} as unknown as jest.Mocked<Redis>;

const RedisConstructor = jest.fn(() => redisMock);

export default RedisConstructor;
export { RedisConstructor as Redis };
