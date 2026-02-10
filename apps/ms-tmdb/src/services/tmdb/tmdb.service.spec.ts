import { HttpStatus } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as unknown as jest.Mocked<typeof axios>;

describe('TmdbService', () => {
  let service: TmdbService;

  const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
    onModuleInit: jest.fn(),
  } satisfies Pick<RedisService, 'get' | 'set' | 'onModuleInit'>;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    process.env.TMDB_API_KEY = 'fake_key';

    jest.spyOn(mockedAxios, 'isAxiosError').mockReturnValue(false);

    service = new TmdbService(redisMock as unknown as RedisService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('obtenirDetailsFilm', () => {
    it('doit renvoyer depuis le cache si présent', async () => {
      jest.spyOn(redisMock, 'get').mockResolvedValueOnce({
        id: 1,
        titre: 'Cached',
        resume: '...',
        date_sortie: '2020-01-01',
        affiche_url: null,
        note_moyenne: 7,
      });

      const getSpy = jest.spyOn(mockedAxios, 'get');

      const film = await service.obtenirDetailsFilm(1);
      expect(film.titre).toBe('Cached');
      expect(getSpy).not.toHaveBeenCalled();
    });

    it('doit appeler TMDB si cache absent, mapper puis set en cache', async () => {
      jest.spyOn(redisMock, 'get').mockResolvedValueOnce(null);

      const getSpy = jest.spyOn(mockedAxios, 'get');
      getSpy.mockResolvedValueOnce({
        data: {
          id: 10,
          title: 'Inception',
          overview: 'Résumé',
          release_date: '2010-07-16',
          poster_path: '/abc.jpg',
          vote_average: 8.8,
        },
      });

      const setSpy = jest.spyOn(redisMock, 'set');

      const film = await service.obtenirDetailsFilm(10);

      expect(film).toEqual({
        id: 10,
        titre: 'Inception',
        resume: 'Résumé',
        date_sortie: '2010-07-16',
        affiche_url: 'https://image.tmdb.org/t/p/w500/abc.jpg',
        note_moyenne: 8.8,
      });

      expect(setSpy).toHaveBeenCalledWith('tmdb:film:10', film, 7200);
    });

    it('affiche_url doit être null si poster_path absent', async () => {
      jest.spyOn(redisMock, 'get').mockResolvedValueOnce(null);

      const getSpy = jest.spyOn(mockedAxios, 'get');
      getSpy.mockResolvedValueOnce({
        data: {
          id: 11,
          title: 'NoPoster',
          overview: null,
          release_date: null,
          poster_path: null,
          vote_average: null,
        },
      });

      const film = await service.obtenirDetailsFilm(11);
      expect(film.affiche_url).toBeNull();
    });

    it('doit transformer une erreur 404 TMDB en HttpException NOT_FOUND', async () => {
      jest.spyOn(redisMock, 'get').mockResolvedValueOnce(null);

      jest.spyOn(mockedAxios, 'isAxiosError').mockReturnValueOnce(true);

      const getSpy = jest.spyOn(mockedAxios, 'get');
      getSpy.mockRejectedValueOnce({
        response: { status: 404, data: { status_message: 'Not found' } },
      });

      await expect(service.obtenirDetailsFilm(999)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('doit transformer une erreur 401 TMDB en HttpException UNAUTHORIZED', async () => {
      jest.spyOn(redisMock, 'get').mockResolvedValueOnce(null);

      jest.spyOn(mockedAxios, 'isAxiosError').mockReturnValueOnce(true);

      const getSpy = jest.spyOn(mockedAxios, 'get');
      getSpy.mockRejectedValueOnce({
        response: { status: 401, data: { status_message: 'Invalid key' } },
      });

      await expect(service.obtenirDetailsFilm(1)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('doit transformer une erreur 429 TMDB en HttpException TOO_MANY_REQUESTS', async () => {
      jest.spyOn(redisMock, 'get').mockResolvedValueOnce(null);

      jest.spyOn(mockedAxios, 'isAxiosError').mockReturnValueOnce(true);

      const getSpy = jest.spyOn(mockedAxios, 'get');
      getSpy.mockRejectedValueOnce({
        response: { status: 429, data: { status_message: 'Rate limit' } },
      });

      await expect(service.obtenirDetailsFilm(1)).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    });

    it('erreur axios (autre status) => renvoie status + status_message si présent', async () => {
      jest.spyOn(redisMock, 'get').mockResolvedValueOnce(null);

      jest.spyOn(mockedAxios, 'isAxiosError').mockReturnValueOnce(true);

      const getSpy = jest.spyOn(mockedAxios, 'get');
      getSpy.mockRejectedValueOnce({
        response: { status: 500, data: { status_message: 'Server error' } },
      });

      await expect(service.obtenirDetailsFilm(1)).rejects.toMatchObject({
        status: 500,
      });
    });

    it('erreur non axios => 500 générique', async () => {
      jest.spyOn(redisMock, 'get').mockResolvedValueOnce(null);

      jest.spyOn(mockedAxios, 'isAxiosError').mockReturnValueOnce(false);

      const getSpy = jest.spyOn(mockedAxios, 'get');
      getSpy.mockRejectedValueOnce(new Error('boom'));

      await expect(service.obtenirDetailsFilm(1)).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('obtenirFilmsPopulaires', () => {
    it('doit renvoyer le cache si présent', async () => {
      jest
        .spyOn(redisMock, 'get')
        .mockResolvedValueOnce([{ id: 1 }] as unknown);

      const getSpy = jest.spyOn(mockedAxios, 'get');

      const res = await service.obtenirFilmsPopulaires();
      expect(res).toHaveLength(1);
      expect(getSpy).not.toHaveBeenCalled();
    });

    it('doit récupérer TMDB, limiter à 10 et mettre en cache', async () => {
      jest.spyOn(redisMock, 'get').mockResolvedValueOnce(null);

      const getSpy = jest.spyOn(mockedAxios, 'get');
      getSpy.mockResolvedValueOnce({
        data: {
          results: Array.from({ length: 12 }).map((_, i) => ({
            id: i + 1,
            title: `Film ${i + 1}`,
            overview: null,
            release_date: null,
            poster_path: null,
            vote_average: null,
          })),
        },
      });

      const setSpy = jest.spyOn(redisMock, 'set');

      const res = await service.obtenirFilmsPopulaires();
      expect(res).toHaveLength(10);

      expect(setSpy).toHaveBeenCalledWith('tmdb:films:populaires', res, 7200);
    });
  });

  describe('rechercherFilms', () => {
    it('doit utiliser une clé cache normalisée en lowercase+trim', async () => {
      jest.spyOn(redisMock, 'get').mockResolvedValueOnce(null);

      const getSpyAxios = jest.spyOn(mockedAxios, 'get');
      getSpyAxios.mockResolvedValueOnce({
        data: { results: [{ id: 1, title: 'A' }] },
      });

      const getSpyRedis = jest.spyOn(redisMock, 'get');

      await service.rechercherFilms('  TeSt  ');
      expect(getSpyRedis).toHaveBeenCalledWith('tmdb:recherche:test');
    });

    it('doit mettre en cache 3600 secondes', async () => {
      jest.spyOn(redisMock, 'get').mockResolvedValueOnce(null);

      const getSpyAxios = jest.spyOn(mockedAxios, 'get');
      getSpyAxios.mockResolvedValueOnce({
        data: { results: [{ id: 1, title: 'A' }] },
      });

      const setSpy = jest.spyOn(redisMock, 'set');

      const res = await service.rechercherFilms('abc');
      expect(setSpy).toHaveBeenCalledWith('tmdb:recherche:abc', res, 3600);
    });
  });

  describe('rechercherFilmsAvancee', () => {
    it('si titre fourni: search/movie puis filtre genre côté Node', async () => {
      jest
        .spyOn(redisMock, 'get')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const getSpy = jest.spyOn(mockedAxios, 'get');
      getSpy
        .mockResolvedValueOnce({
          data: {
            results: [
              { id: 1, title: 'X', genre_ids: [28] },
              { id: 2, title: 'Y', genre_ids: [12] },
            ],
          },
        })
        .mockResolvedValueOnce({
          data: { genres: [{ id: 28, name: 'Action' }] },
        });

      const res = await service.rechercherFilmsAvancee({
        titre: 'test',
        genre: 'Action',
      });

      expect(res.map((x) => x.id)).toEqual([1]);
    });

    it('si genre inconnu: renvoie [] et cache 600s', async () => {
      jest
        .spyOn(redisMock, 'get')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce([{ id: 28, name: 'Action' }]);

      const getSpy = jest.spyOn(mockedAxios, 'get');
      getSpy.mockResolvedValueOnce({
        data: { results: [{ id: 1, title: 'X', genre_ids: [28] }] },
      });

      const setSpy = jest.spyOn(redisMock, 'set');

      const res = await service.rechercherFilmsAvancee({
        titre: 'test',
        genre: 'Inconnu',
      });

      expect(res).toEqual([]);

      expect(setSpy).toHaveBeenCalledWith(
        expect.stringContaining('tmdb:recherche_avancee:'),
        [],
        600,
      );
    });
    it('si résultat en cache: renvoie le cache et n’appelle pas axios', async () => {
      // Arrange: cache hit
      const cached = [{ id: 123, titre: 'Cached Film' }];
      jest.spyOn(redisMock, 'get').mockResolvedValueOnce(cached as unknown);

      const axiosGetSpy = jest.spyOn(mockedAxios, 'get');

      // Act
      const res = await service.rechercherFilmsAvancee({
        titre: 'test',
        genre: 'Action',
      });

      // Assert
      expect(res).toEqual(cached);
      expect(axiosGetSpy).not.toHaveBeenCalled();
    });
    it('sans titre: doit appeler discover/movie avec annee+genre, mapper puis mettre en cache (1800s)', async () => {
      // Arrange
      jest
        .spyOn(redisMock, 'get')
        // 1) cache recherche avancée => miss
        .mockResolvedValueOnce(null)
        // 2) cache genres => hit (باش ما يديرش axios على /genre/movie/list)
        .mockResolvedValueOnce([{ id: 28, name: 'Action' }]);

      const getSpy = jest.spyOn(mockedAxios, 'get');

      // discover/movie response
      getSpy.mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 1,
              title: 'Film 1',
              overview: null,
              release_date: '2020-01-01',
              poster_path: '/p.jpg',
              vote_average: 7.5,
              genre_ids: [28],
            },
          ],
        },
      });

      const setSpy = jest.spyOn(redisMock, 'set');

      // Act
      const res = await service.rechercherFilmsAvancee({
        annee: '2020',
        genre: 'Action',
      });

      // Assert
      expect(getSpy).toHaveBeenCalledTimes(1);

      const [calledUrl, calledConfig] = getSpy.mock.calls[0] as unknown as [
        string,
        { params?: Record<string, unknown> },
      ];

      expect(calledUrl).toContain('/discover/movie');

      expect(calledConfig.params).toEqual(
        expect.objectContaining({
          api_key: 'fake_key',
          language: 'fr-FR',
          sort_by: 'popularity.desc',
          page: 1,
          primary_release_year: '2020',
          with_genres: 28,
        }),
      );

      expect(res).toEqual([
        {
          id: 1,
          titre: 'Film 1',
          resume: 'Pas de résumé disponible',
          date_sortie: '2020-01-01',
          affiche_url: 'https://image.tmdb.org/t/p/w500/p.jpg',
          note_moyenne: 7.5,
        },
      ]);

      expect(setSpy).toHaveBeenCalledWith(
        expect.stringContaining('tmdb:recherche_avancee:'),
        res,
        1800,
      );
    });
  });
});
