import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../../../packages/schemas/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID, randomBytes, createHash } from 'node:crypto';


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

    it('doit auto-verifier quand VERIFICATION_MAIL est FALSE', async () => {
      process.env.VERIFICATION_MAIL = 'FALSE';

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (randomUUID as jest.Mock).mockReturnValue('uuid-token');

      const mockUser = {
        nom: 'John',
        email: 'john@example.com',
        mot_de_passe_hash: 'hashedpassword',
        role: UserRole.USER,
        email_verifie: true,
        email_verification_token: null,
      } as User;

      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      const result = await service.createUser('John', 'john@example.com', 'password');

      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email_verifie: true,
          email_verification_token: null,
        }),
      );
      expect(result).toEqual(mockUser);

      delete process.env.VERIFICATION_MAIL;
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
  describe('findProfileById', () => {
    it('should return user profile with selected fields', async () => {
      const mockProfile = {
        id: 'u1',
        nom: 'Mehdi',
        email: 'mehdi@test.com',
        role: UserRole.USER,
        email_verifie: true,
        cree_le: new Date(),
      } as User;

      usersRepository.findOne.mockResolvedValue(mockProfile);

      const result = await service.findProfileById('u1');

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'u1' },
        select: {
          id: true,
          nom: true,
          email: true,
          role: true,
          email_verifie: true,
          cree_le: true,
        },
      });
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfileNom', () => {
    it('should return null when user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.updateProfileNom('u1', 'NouveauNom');

      expect(result).toBeNull();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('should update name, save user, and return updated profile', async () => {
      const existingUser = { id: 'u1', nom: 'AncienNom' } as User;
      const updatedProfile = {
        id: 'u1',
        nom: 'NouveauNom',
        email: 'mehdi@test.com',
        role: UserRole.USER,
        email_verifie: true,
        cree_le: new Date(),
      } as User;

      usersRepository.findOne
        .mockResolvedValueOnce(existingUser) // findOne in updateProfileNom
        .mockResolvedValueOnce(updatedProfile); // findProfileById -> findOne
      usersRepository.save.mockResolvedValue(existingUser);

      const result = await service.updateProfileNom('u1', 'NouveauNom');

      expect(existingUser.nom).toBe('NouveauNom');
      expect(usersRepository.save).toHaveBeenCalledWith(existingUser);
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('issuePasswordResetToken', () => {
    it('doit retourner null si user n existe pas', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.issuePasswordResetToken('none@test.com');

      expect(result).toBeNull();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('doit generer un token, le hash , sauvegarder user et return ligne token', async () => {
      const mockUser = { email: 'mehdi@test.com' } as User;
      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);

      (randomBytes as jest.Mock).mockReturnValue(Buffer.from('raw-token'));
      const update = jest.fn().mockReturnThis();
      const digest = jest.fn().mockReturnValue('hashed-token');
      (createHash as jest.Mock).mockReturnValue({ update, digest });

      const result = await service.issuePasswordResetToken('mehdi@test.com', 30);

      expect(result).toBe('7261772d746f6b656e'); 
      expect(mockUser.rinitialiser_mdp_token_hash).toBe('hashed-token');
      expect(mockUser.reinitialiser_mdp_expires_at).toBeInstanceOf(Date);
      expect(usersRepository.save).toHaveBeenCalledWith(mockUser);
    });
  });

describe('resetPasswordWithToken', () => {
  it('doit retourner false si token non trouve', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    const result = await service.resetPasswordWithToken('bad', 'NewPass123!');

    expect(result).toBe(false);
  });

  it('doit retourner false si expiration manquante', async () => {
    const mockUser = { rinitialiser_mdp_token_hash: 'h', reinitialiser_mdp_expires_at: null } as User;
    usersRepository.findOne.mockResolvedValue(mockUser);

    const result = await service.resetPasswordWithToken('token', 'NewPass123!');

    expect(result).toBe(false);
  });

  it('doit retourner false si token est expire', async () => {
    const mockUser = {
      rinitialiser_mdp_token_hash: 'h',
      reinitialiser_mdp_expires_at: new Date(Date.now() - 60_000),
    } as User;
    usersRepository.findOne.mockResolvedValue(mockUser);

    const result = await service.resetPasswordWithToken('token', 'NewPass123!');

    expect(result).toBe(false);
  });

  it('doit reset le mot de passe et effacer les champs de token de reinitialisation quand le token est valide', async () => {
    const mockUser = {
      mot_de_passe_hash: 'old-hash',
      rinitialiser_mdp_token_hash: 'hashed-token',
      reinitialiser_mdp_expires_at: new Date(Date.now() + 60_000),
    } as User;

    usersRepository.findOne.mockResolvedValue(mockUser);
    usersRepository.save.mockResolvedValue(mockUser);

    const update = jest.fn().mockReturnThis();
    const digest = jest.fn().mockReturnValue('hashed-token');
    (createHash as jest.Mock).mockReturnValue({ update, digest });
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

    const result = await service.resetPasswordWithToken('raw-token', 'NewPass123!');

    expect(result).toBe(true);
    expect(mockUser.mot_de_passe_hash).toBe('new-hash');
    expect(mockUser.rinitialiser_mdp_token_hash).toBeNull();
    expect(mockUser.reinitialiser_mdp_expires_at).toBeNull();
    expect(usersRepository.save).toHaveBeenCalledWith(mockUser);
  });
});

  

});
