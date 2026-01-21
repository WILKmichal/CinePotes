import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { TmdbService } from './tmdb.service';
import { RedisService } from '../redis/redis.service';

// On mock axios (get + isAxiosError)
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TmdbService', () => {
  let service: TmdbService;

  // Mock RedisService (seulement ce qu’on utilise)
  const redisMock: jest.Mocked<RedisService> = {
    get: jest.fn(),
    set: jest.fn(),
    onModuleInit: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    // On évite les logs pendant les tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Valeur par défaut de la clé
    process.env.TMDB_API_KEY = 'fake_key';

    // IMPORTANT:
    // Quand axios est mocké, isAxiosError peut ne pas être un mock "callable".
    // On force un jest.fn() pour pouvoir contrôler son retour.
    (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn();

    service = new TmdbService(redisMock);
  });

  afterEach(() => {
    // Restore des spies console
    (console.log as unknown as jest.Mock).mockRestore?.();
    (console.error as unknown as jest.Mock).mockRestore?.();
  });

  describe('obtenirDetailsFilm', () => {
    it('doit renvoyer depuis le cache si présent', async () => {
      redisMock.get.mockResolvedValueOnce({
        id: 1,
        titre: 'Cached',
        resume: '...',
        date_sortie: '2020-01-01',
        affiche_url: null,
        note_moyenne: 7,
      });

      const film = await service.obtenirDetailsFilm(1);
      expect(film.titre).toBe('Cached');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('doit appeler TMDB si cache absent, mapper puis set en cache', async () => {
      redisMock.get.mockResolvedValueOnce(null);

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 10,
          title: 'Inception',
          overview: 'Résumé',
          release_date: '2010-07-16',
          poster_path: '/abc.jpg',
          vote_average: 8.8,
        },
      } as any);

      const film = await service.obtenirDetailsFilm(10);

      expect(film).toEqual({
        id: 10,
        titre: 'Inception',
        resume: 'Résumé',
        date_sortie: '2010-07-16',
        affiche_url: 'https://image.tmdb.org/t/p/w500/abc.jpg',
        note_moyenne: 8.8,
      });

      expect(redisMock.set).toHaveBeenCalledWith('tmdb:film:10', film, 7200);
    });

    it('affiche_url doit être null si poster_path absent', async () => {
      redisMock.get.mockResolvedValueOnce(null);

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 11,
          title: 'NoPoster',
          overview: null,
          release_date: null,
          poster_path: null,
          vote_average: null,
        },
      } as any);

      const film = await service.obtenirDetailsFilm(11);
      expect(film.affiche_url).toBeNull();
    });

    it('doit transformer une erreur 404 TMDB en HttpException NOT_FOUND', async () => {
      redisMock.get.mockResolvedValueOnce(null);

      // On force axios.isAxiosError => true
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(
        true,
      );

      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404, data: { status_message: 'Not found' } },
      });

      await expect(service.obtenirDetailsFilm(999)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('doit transformer une erreur 401 TMDB en HttpException UNAUTHORIZED', async () => {
      redisMock.get.mockResolvedValueOnce(null);

      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(
        true,
      );

      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 401, data: { status_message: 'Invalid key' } },
      });

      await expect(service.obtenirDetailsFilm(1)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('doit transformer une erreur 429 TMDB en HttpException TOO_MANY_REQUESTS', async () => {
      redisMock.get.mockResolvedValueOnce(null);

      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(
        true,
      );

      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 429, data: { status_message: 'Rate limit' } },
      });

      await expect(service.obtenirDetailsFilm(1)).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    });

    it("erreur axios (autre status) => renvoie status + status_message si présent", async () => {
      redisMock.get.mockResolvedValueOnce(null);

      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(
        true,
      );

      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 500, data: { status_message: 'Server error' } },
      });

      // Une seule attente (pas de double appel non mocké)
      await expect(service.obtenirDetailsFilm(1)).rejects.toMatchObject({
        status: 500,
      });
    });

    it('erreur non axios => 500 générique', async () => {
      redisMock.get.mockResolvedValueOnce(null);

      // Force isAxiosError => false
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(
        false,
      );

      mockedAxios.get.mockRejectedValueOnce(new Error('boom'));

      await expect(service.obtenirDetailsFilm(1)).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('obtenirFilmsPopulaires', () => {
    it('doit renvoyer le cache si présent', async () => {
      redisMock.get.mockResolvedValueOnce([{ id: 1 } as any]);

      const res = await service.obtenirFilmsPopulaires();
      expect(res).toHaveLength(1);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('doit récupérer TMDB, limiter à 10 et mettre en cache', async () => {
      redisMock.get.mockResolvedValueOnce(null);

      mockedAxios.get.mockResolvedValueOnce({
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
      } as any);

      const res = await service.obtenirFilmsPopulaires();
      expect(res).toHaveLength(10);

      expect(redisMock.set).toHaveBeenCalledWith(
        'tmdb:films:populaires',
        res,
        7200,
      );
    });
  });

  describe('rechercherFilms', () => {
    it('doit utiliser une clé cache normalisée en lowercase+trim', async () => {
      redisMock.get.mockResolvedValueOnce(null);

      mockedAxios.get.mockResolvedValueOnce({
        data: { results: [{ id: 1, title: 'A' }] },
      } as any);

      await service.rechercherFilms('  TeSt  ');
      expect(redisMock.get).toHaveBeenCalledWith('tmdb:recherche:test');
    });

    it('doit mettre en cache 3600 secondes', async () => {
      redisMock.get.mockResolvedValueOnce(null);

      mockedAxios.get.mockResolvedValueOnce({
        data: { results: [{ id: 1, title: 'A' }] },
      } as any);

      const res = await service.rechercherFilms('abc');
      expect(redisMock.set).toHaveBeenCalledWith(
        'tmdb:recherche:abc',
        res,
        3600,
      );
    });
  });

  describe('rechercherFilmsAvancee', () => {
    it('si titre fourni: search/movie puis filtre genre côté Node', async () => {
      // cache recherche avancée absent
      redisMock.get.mockResolvedValueOnce(null);

      // appel search/movie
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          results: [
            { id: 1, title: 'X', genre_ids: [28] },
            { id: 2, title: 'Y', genre_ids: [12] },
          ],
        },
      } as any);

      // obtenirGenres() => cache genres absent
      redisMock.get.mockResolvedValueOnce(null);

      // axios genre/list
      mockedAxios.get.mockResolvedValueOnce({
        data: { genres: [{ id: 28, name: 'Action' }] },
      } as any);

      const res = await service.rechercherFilmsAvancee({
        titre: 'test',
        genre: 'Action',
      });

      expect(res.map((x) => x.id)).toEqual([1]);
    });

    it('si genre inconnu: renvoie [] et cache 600s', async () => {
      // cache recherche avancée absent
      redisMock.get.mockResolvedValueOnce(null);

      // titre fourni => search/movie
      mockedAxios.get.mockResolvedValueOnce({
        data: { results: [{ id: 1, title: 'X', genre_ids: [28] }] },
      } as any);

      // obtenirGenres => genres déjà en cache mais ne contient pas le genre demandé
      redisMock.get.mockResolvedValueOnce([{ id: 28, name: 'Action' }]);

      const res = await service.rechercherFilmsAvancee({
        titre: 'test',
        genre: 'Inconnu',
      });

      expect(res).toEqual([]);

      // clé cache contient un JSON stringify, on match juste le début
      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining('tmdb:recherche_avancee:'),
        [],
        600,
      );
    });

    it('sans titre: utilise discover/movie (année/genre) et cache 1800s', async () => {
      // cache recherche avancée absent
      redisMock.get.mockResolvedValueOnce(null);

      // obtenirGenres => genres en cache
      redisMock.get.mockResolvedValueOnce([{ id: 28, name: 'Action' }]);

      // discover/movie
      mockedAxios.get.mockResolvedValueOnce({
        data: { results: [{ id: 9, title: 'Z' }] },
      } as any);

      const res = await service.rechercherFilmsAvancee({
        annee: '2020',
        genre: 'Action',
      });

      expect(res).toHaveLength(1);

      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining('tmdb:recherche_avancee:'),
        res,
        1800,
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/discover/movie'),
        expect.objectContaining({
          params: expect.objectContaining({
            primary_release_year: '2020',
            with_genres: 28,
          }),
        }),
      );
    });
  });
});