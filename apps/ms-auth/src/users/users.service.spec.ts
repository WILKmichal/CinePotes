import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../../../packages/schemas/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID, randomBytes, createHash } from 'node:crypto';

// Mock bcrypt
jest.mock('bcryptjs');

// Mock crypto functions
jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'uuid-token'),
  randomBytes: jest.fn(() => Buffer.from('randombytes')),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'token-hash'),
  })),
}));

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn(), save: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
  });

  describe('findOne', () => {
    it('should return a user if found by email', async () => {
      const mockUser = { id: '1', email: 'test@example.com' } as User;
      usersRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findOne('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.findOne('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create and save a user', async () => {
      const mockHashedPassword = 'hashedpassword';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);

      const mockUser = {
        nom: 'John Doe',
        email: 'john@example.com',
        mot_de_passe_hash: mockHashedPassword,
        role: UserRole.USER,
        email_verifie: false,
        email_verification_token: 'uuid-token',
      } as User;

      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      const result = await service.createUser('John Doe', 'john@example.com', 'password');

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(result).toEqual(mockUser);
    });

    it('should create verified user if VERIFICATION_MAIL is FALSE', async () => {
      process.env.VERIFICATION_MAIL = 'FALSE';
      const mockHashedPassword = 'hashed';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);

      const mockUser = {
        nom: 'Jane',
        email: 'jane@example.com',
        mot_de_passe_hash: mockHashedPassword,
        email_verifie: true,
        email_verification_token: null,
      } as User;

      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      const result = await service.createUser('Jane', 'jane@example.com', 'pass');

      expect(result.email_verifie).toBe(true);
      expect(result.email_verification_token).toBeNull();

      delete process.env.VERIFICATION_MAIL;
    });
  });

  describe('issuePasswordResetToken', () => {
    it('should return null if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.issuePasswordResetToken('unknown@example.com');
      expect(result).toBeNull();
    });

    it('should generate token and save user', async () => {
      const mockUser = { email: 'user@example.com', rinitialiser_mdp_token_hash: null, reinitialiser_mdp_expires_at: null } as User;
      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      const token = await service.issuePasswordResetToken('user@example.com', 10);

      expect(token).toBeDefined();
      expect(mockUser.rinitialiser_mdp_token_hash).toBe('token-hash');
      expect(mockUser.reinitialiser_mdp_expires_at).toBeInstanceOf(Date);
      expect(usersRepository.save).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('resetPasswordWithToken', () => {
    it('should return false if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.resetPasswordWithToken('token', 'newPass');
      expect(result).toBe(false);
    });

    it('should return false if token expired', async () => {
      const mockUser = { reinitialiser_mdp_expires_at: new Date(Date.now() - 1000) } as User;
      usersRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.resetPasswordWithToken('token', 'newPass');
      expect(result).toBe(false);
    });

    it('should reset password if token valid', async () => {
      const mockUser = {
        mot_de_passe_hash: '',
        rinitialiser_mdp_token_hash: 'hash',
        reinitialiser_mdp_expires_at: new Date(Date.now() + 10000),
      } as User;
      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpass');

      const result = await service.resetPasswordWithToken('token', 'newPass');

      expect(result).toBe(true);
      expect(mockUser.mot_de_passe_hash).toBe('newhashedpass');
      expect(mockUser.rinitialiser_mdp_token_hash).toBeNull();
      expect(mockUser.reinitialiser_mdp_expires_at).toBeNull();
    });
  });

  describe('confirmEmail', () => {
    it('should return true and update user when token exists', async () => {
      const mockUser = { email_verifie: false, email_verification_token: 'valid-token' } as User;
      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      const result = await service.confirmEmail('valid-token');

      expect(result).toBe(true);
      expect(mockUser.email_verifie).toBe(true);
      expect(mockUser.email_verification_token).toBeNull();
    });

    it('should return false when token does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.confirmEmail('invalid-token');
      expect(result).toBe(false);
    });
  });
});