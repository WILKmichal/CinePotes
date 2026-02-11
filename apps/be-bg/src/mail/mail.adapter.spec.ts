import { Test, TestingModule } from '@nestjs/testing';
import { MailAdapter } from './mail.adapter';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('MailAdapter (mocks)', () => {
  let adapter: MailAdapter;

  const httpMock = {
    axiosRef: {
      post: jest.fn(),
    },
  };

  const configMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    configMock.get.mockImplementation((key: string) => {
      if (key === 'MAIL_MS_BASE_URL') return 'http://localhost:3003';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailAdapter,
        { provide: HttpService, useValue: httpMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    adapter = module.get(MailAdapter);
  });

  it('doit POST sur /mail/reset-password avec le bon payload', async () => {
    httpMock.axiosRef.post.mockResolvedValue({});

    const payload = {
      email: 'test@example.com',
      resetUrl: 'http://localhost:3000/reset-password?token=abc',
      expiresInMinutes: 30,
    };

    await adapter.sendResetPasswordEmail(payload);

    expect(httpMock.axiosRef.post).toHaveBeenCalledTimes(1);
    expect(httpMock.axiosRef.post).toHaveBeenCalledWith(
      'http://localhost:3003/mail/reset-password',
      payload,
    );
  });

  it('utilise le fallback si MAIL_MS_BASE_URL est absent', async () => {
    configMock.get.mockReturnValue(undefined);
    httpMock.axiosRef.post.mockResolvedValue({});

    const payload = {
      email: 'test@example.com',
      resetUrl: 'x',
      expiresInMinutes: 10,
    };

    await adapter.sendResetPasswordEmail(payload);

    expect(httpMock.axiosRef.post).toHaveBeenCalledWith(
      'http://localhost:3003/mail/reset-password',
      payload,
    );
  });
});