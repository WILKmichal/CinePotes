import { UsersService } from './users.service';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let repo: any;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    service = new UsersService(repo);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * ✅ CREATE USER — SUCCESS
   */
  it('creates a user successfully', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue({ email: 'test@example.com' });
    repo.save.mockResolvedValue({ id: 1 });

    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

    const user = await service.createUser(
      'Test',
      'test@example.com',
      'Password123!',
    );

    expect(user).toBeDefined();
    expect(repo.save).toHaveBeenCalled();
  });

  /**
   * ❌ CREATE USER — EMAIL ALREADY EXISTS
   */
  it('throws ConflictException if email exists', async () => {
    repo.findOne.mockResolvedValue({ email: 'test@example.com' });

    await expect(
      service.createUser('Test', 'test@example.com', 'Password123!'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  /**
   * ❌ CREATE USER — BCRYPT HASH FAILS
   * 👉 couvre la branche catch
   */
  it('throws error if bcrypt hash fails', async () => {
    repo.findOne.mockResolvedValue(null);

    jest
      .spyOn(bcrypt, 'hash')
      .mockRejectedValue(new Error('Hash error'));

    await expect(
      service.createUser('Test', 'test@example.com', 'Password123!'),
    ).rejects.toThrow();
  });

  /**
   * ❌ CREATE USER — SAVE FAILS
   */
  it('throws error if save fails', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue({ email: 'test@example.com' });
    repo.save.mockRejectedValue(new Error('DB error'));

    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

    await expect(
      service.createUser('Test', 'test@example.com', 'Password123!'),
    ).rejects.toThrow();
  });

  /**
   * ✅ CONFIRM EMAIL — SUCCESS
   */
  it('confirms email with valid token', async () => {
    repo.findOne.mockResolvedValue({
      email_verifie: false,
    });

    repo.save.mockResolvedValue(true);

    const result = await service.confirmEmail('token');

    expect(result).toBe(true);
    expect(repo.save).toHaveBeenCalled();
  });

  /**
   * ❌ CONFIRM EMAIL — TOKEN INVALID
   */
  it('returns false if token is invalid', async () => {
    repo.findOne.mockResolvedValue(null);

    const result = await service.confirmEmail('bad-token');

    expect(result).toBe(false);
  });

/**
 * ❌ CREATE USER — FINDONE THROWS
 * 👉 couvre la branche "exception non prévue"
 */
it('throws if findOne throws an error', async () => {
  repo.findOne.mockRejectedValue(new Error('DB find error'));

  await expect(
    service.createUser('Test', 'test@example.com', 'Password123!'),
  ).rejects.toThrow('DB find error');
});

/**
 * ❌ CREATE USER — SAVE RETURNS NULL
 * 👉 couvre branche implicite "save échoue silencieusement"
 */
it('throws if save returns null', async () => {
  repo.findOne.mockResolvedValue(null);
  repo.create.mockReturnValue({ email: 'test@example.com' });
  repo.save.mockResolvedValue(null);

  jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

  await expect(
    service.createUser('Test', 'test@example.com', 'Password123!'),
  ).rejects.toThrow();
});

/**
 * ❌ CONFIRM EMAIL — SAVE THROWS
 * 👉 couvre dernière branche non couverte
 */
it('returns false if save throws during email confirmation', async () => {
  repo.findOne.mockResolvedValue({
    email_verifie: false,
  });

  repo.save.mockRejectedValue(new Error('Save error'));

  const result = await service.confirmEmail('token');

  expect(result).toBe(false);
});





  /**
   * ❌ CONFIRM EMAIL — ALREADY VERIFIED
   * 👉 branche souvent oubliée
   */
  it('returns false if email already verified', async () => {
    repo.findOne.mockResolvedValue({
      email_verifie: true,
    });

    const result = await service.confirmEmail('token');

    expect(result).toBe(false);
  });
});
