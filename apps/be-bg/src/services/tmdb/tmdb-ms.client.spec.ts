import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { TmdbMsClient } from './tmdb-ms.client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TmdbMsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // On le mocke explicitement pour contrôler la branche exécutée.
    (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn();
  });

  it('get() doit retourner res.data', async () => {
    // On simule l’instance Axios retournée par axios.create(...)
    const getMock = jest.fn().mockResolvedValue({ data: { ok: true } });
    mockedAxios.create.mockReturnValue({ get: getMock } as any);

    const client = new TmdbMsClient();
    const res = await client.get('/tmdb/films/populaires');

    expect(res).toEqual({ ok: true });

    // Vérifie que le client a bien appelé Axios avec { params: undefined }
    expect(getMock).toHaveBeenCalledWith('/tmdb/films/populaires', {
      params: undefined,
    });
  });

  it('doit transformer une erreur axios avec message string en HttpException (status conservé)', async () => {
    const getMock = jest.fn().mockRejectedValue({
      response: {
        status: 400,
        data: { message: 'Bad request' },
      },
    });
    mockedAxios.create.mockReturnValue({ get: getMock } as any);

    // Force axios.isAxiosError => true pour passer dans la branche AxiosError
    (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

    const client = new TmdbMsClient();

    try {
      await client.get('/x');
      fail('Une HttpException était attendue');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      const ex = e as HttpException;

      expect(ex.getStatus()).toBe(400);
      // message accessible via ex.message
      expect(ex.message).toContain('Bad request');
    }
  });

  it('doit concaténer message[] si Nest renvoie un tableau', async () => {
    const getMock = jest.fn().mockRejectedValue({
      response: {
        status: 422,
        data: { message: ['a', 'b'] },
      },
    });
    mockedAxios.create.mockReturnValue({ get: getMock } as any);

    (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

    const client = new TmdbMsClient();

    try {
      await client.get('/x');
      fail('Une HttpException était attendue');
    } catch (e) {
      const ex = e as HttpException;

      expect(ex.getStatus()).toBe(422);
      expect(ex.message).toContain('a, b');
    }
  });

  it('doit fallback sur data.error si message absent', async () => {
    const getMock = jest.fn().mockRejectedValue({
      response: {
        status: 500,
        data: { error: 'Internal' },
      },
    });
    mockedAxios.create.mockReturnValue({ get: getMock } as any);

    (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

    const client = new TmdbMsClient();

    try {
      await client.get('/x');
      fail('Une HttpException était attendue');
    } catch (e) {
      const ex = e as HttpException;

      expect(ex.getStatus()).toBe(500);
      expect(ex.message).toContain('Internal');
    }
  });

  it('doit fallback sur message générique si data ne contient ni message ni error', async () => {
    const getMock = jest.fn().mockRejectedValue({
      response: {
        status: 500,
        data: {}, // ni message, ni error
      },
    });
    mockedAxios.create.mockReturnValue({ get: getMock } as any);

    (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

    const client = new TmdbMsClient();

    try {
      await client.get('/x');
      fail('Une HttpException était attendue');
    } catch (e) {
      const ex = e as HttpException;

      expect(ex.getStatus()).toBe(500);
      expect(ex.message).toContain('TMDB microservice error');
    }
  });

  it('erreur non-axios => HttpException 500 générique', async () => {
    const getMock = jest.fn().mockRejectedValue(new Error('boom'));
    mockedAxios.create.mockReturnValue({ get: getMock } as any);

    // Force axios.isAxiosError => false pour aller dans le fallback non-axios
    (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);

    const client = new TmdbMsClient();

    try {
      await client.get('/x');
      fail('Une HttpException était attendue');
    } catch (e) {
      const ex = e as HttpException;

      expect(ex.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(ex.message).toContain('TMDB microservice error');
    }
  });
});
