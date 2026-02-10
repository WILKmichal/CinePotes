import { HttpException, HttpStatus } from '@nestjs/common';
import { TmdbController } from './tmdb.controller';
import { TmdbMsClient } from './tmdb-ms.client';

type UnknownHttpResponse =
  | string
  | { message?: string | string[] }
  | Record<string, unknown>;

function responseToMessage(resp: unknown): string {
  if (typeof resp === 'string') return resp;

  if (resp && typeof resp === 'object') {
    const r = resp as Exclude<UnknownHttpResponse, string>;

    // cas Nest classique: { message: string | string[] }
    if ('message' in r) {
      const msg = (r as { message?: unknown }).message;

      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg) && msg.every((x) => typeof x === 'string')) {
        return msg.join(', ');
      }
    }

    return JSON.stringify(r);
  }

  return String(resp);
}

/**
 * Helper :
 * - exécute une fonction
 * - vérifie qu’elle lève une HttpException
 * - vérifie le status
 * - vérifie éventuellement qu’un bout de message est présent
 */
function expectHttpException(
  fn: () => unknown,
  status: number,
  msgPart?: string,
) {
  try {
    fn();
    fail('Une HttpException était attendue');
  } catch (e: unknown) {
    expect(e).toBeInstanceOf(HttpException);
    const ex = e as HttpException;

    expect(ex.getStatus()).toBe(status);

    if (msgPart) {
      const message = responseToMessage(ex.getResponse());
      expect(message).toContain(msgPart);
    }
  }
}

describe('TmdbController (gateway be-bg)', () => {
  let controller: TmdbController;

  // Mock typé sans any
  const msMock: jest.Mocked<Pick<TmdbMsClient, 'get'>> = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TmdbController(msMock as unknown as TmdbMsClient);
  });

  describe('getMovies', () => {
    it('doit refuser si ids est manquant', () => {
      expectHttpException(
        () => controller.getMovies(''),
        HttpStatus.BAD_REQUEST,
        'ids est requis',
      );
    });

    it('doit refuser si ids invalide (aucun nombre)', () => {
      expectHttpException(
        () => controller.getMovies('abc,def'),
        HttpStatus.BAD_REQUEST,
        'ids invalide',
      );
    });

    it('doit forward vers ms-tmdb avec ids nettoyés (join sans espaces)', async () => {
      msMock.get.mockResolvedValueOnce([]);

      await controller.getMovies(' 1, 2,abc, 3 ');

      expect(msMock.get).toHaveBeenCalledWith('/tmdb/movies', { ids: '1,2,3' });
    });
  });

  describe('getPopularMovies', () => {
    it('doit forward vers /tmdb/films/populaires', async () => {
      msMock.get.mockResolvedValueOnce([]);

      await controller.getPopularMovies();

      expect(msMock.get).toHaveBeenCalledWith('/tmdb/films/populaires');
    });
  });

  describe('rechercherFilms', () => {
    it('doit refuser si query manquant', () => {
      expectHttpException(
        () => controller.rechercherFilms(''),
        HttpStatus.BAD_REQUEST,
        'au moins 3 caractères',
      );
    });

    it('doit refuser si query < 3', () => {
      expectHttpException(
        () => controller.rechercherFilms('ab'),
        HttpStatus.BAD_REQUEST,
        'au moins 3 caractères',
      );
    });

    it('doit forward vers /tmdb/recherche avec query', async () => {
      msMock.get.mockResolvedValueOnce([]);

      await controller.rechercherFilms('batman');

      expect(msMock.get).toHaveBeenCalledWith('/tmdb/recherche', {
        query: 'batman',
      });
    });
  });

  describe('rechercherFilmsAvancee', () => {
    it('doit refuser si aucun critère', () => {
      // On veut simuler un appel sans args (comme Nest pourrait le faire)
      // sans utiliser `any` ni accéder à une méthode via un objet `any`.
      const call = () =>
        (
          controller.rechercherFilmsAvancee as (...args: unknown[]) => unknown
        )();

      expectHttpException(call, HttpStatus.BAD_REQUEST, 'Au moins un critère');
    });

    it('doit refuser si titre < 2', () => {
      const call = () =>
        (controller.rechercherFilmsAvancee as (...args: unknown[]) => unknown)(
          'a',
        );

      expectHttpException(
        call,
        HttpStatus.BAD_REQUEST,
        'au moins 2 caractères',
      );
    });

    it("doit refuser si annee n'est pas YYYY", () => {
      const call = () =>
        (controller.rechercherFilmsAvancee as (...args: unknown[]) => unknown)(
          '',
          '20xx',
        );

      expectHttpException(call, HttpStatus.BAD_REQUEST, 'format YYYY');
    });

    it('doit forward vers /tmdb/recherche/avancee en trimant les valeurs', async () => {
      msMock.get.mockResolvedValueOnce([]);

      await controller.rechercherFilmsAvancee(
        '  Matrix ',
        ' 1999 ',
        ' Action ',
      );

      expect(msMock.get).toHaveBeenCalledWith('/tmdb/recherche/avancee', {
        titre: 'Matrix',
        annee: '1999',
        genre: 'Action',
      });
    });
  });

  describe('getMovie', () => {
    it('doit forward vers /tmdb/:id', async () => {
      msMock.get.mockResolvedValueOnce({} as unknown);

      await controller.getMovie(7);

      expect(msMock.get).toHaveBeenCalledWith('/tmdb/7');
    });
  });
});
