import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should throw if user not found', async () => {
    mockUsersService.findOne.mockResolvedValue(null);

    await expect(
      service.signIn('test@mail.com', 'password'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw if email not verified', async () => {
    mockUsersService.findOne.mockResolvedValue({
      email_verifie: false,
    });

    await expect(
      service.signIn('test@mail.com', 'password'),
    ).rejects.toThrow('Merci de confirmer votre email');
  });

  it('should throw if password is invalid', async () => {
    mockUsersService.findOne.mockResolvedValue({
      id: 1,
      email: 'test@mail.com',
      email_verifie: true,
      mot_de_passe_hash: 'hashed',
      role: 'user',
    });

    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(
      service.signIn('test@mail.com', 'wrong'),
    ).rejects.toThrow('Mot de passe invalide');
  });

  it('should return access_token on success', async () => {
    mockUsersService.findOne.mockResolvedValue({
      id: 1,
      email: 'test@mail.com',
      email_verifie: true,
      mot_de_passe_hash: 'hashed',
      role: 'user',
    });

    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    mockJwtService.signAsync.mockResolvedValue('jwt-token');

    const result = await service.signIn('test@mail.com', 'password');

    expect(result).toEqual({ access_token: 'jwt-token' });
  });
});
