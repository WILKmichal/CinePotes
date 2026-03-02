import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User, UserRole } from 'schemas/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

jest.mock('bcryptjs');
jest.mock('crypto');

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
      (randomUUID as jest.Mock).mockReturnValue('uuid-token');

      const mockUser = { nom: 'John Doe', email: 'john@example.com', mot_de_passe_hash: mockHashedPassword, role: UserRole.USER, email_verifie: false, email_verification_token: 'uuid-token' } as User;
      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      const result = await service.createUser('John Doe', 'john@example.com', 'password');
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(result).toEqual(mockUser);
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
