import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({ compare: jest.fn() }));

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = { findOne: jest.fn() };
  const mockJwtService = { signAsync: jest.fn() };

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

  it('should throw RpcException if user not found', async () => {
    mockUsersService.findOne.mockResolvedValue(null);
    await expect(service.signIn('test@mail.com', 'password')).rejects.toThrow(RpcException);
  });

  it('should throw RpcException if email not verified', async () => {
    mockUsersService.findOne.mockResolvedValue({ email_verifie: false });
    await expect(service.signIn('test@mail.com', 'password')).rejects.toThrow(RpcException);
  });

  it('should throw RpcException if password is invalid', async () => {
    mockUsersService.findOne.mockResolvedValue({ id: 1, email: 'test@mail.com', email_verifie: true, mot_de_passe_hash: 'hashed' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.signIn('test@mail.com', 'wrong')).rejects.toThrow(RpcException);
  });

  it('should return access_token on success', async () => {
    mockUsersService.findOne.mockResolvedValue({ id: 1, email: 'test@mail.com', email_verifie: true, mot_de_passe_hash: 'hashed' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockJwtService.signAsync.mockResolvedValue('jwt-token');
    const result = await service.signIn('test@mail.com', 'password');
    expect(result).toEqual({ access_token: 'jwt-token' });
  });
});