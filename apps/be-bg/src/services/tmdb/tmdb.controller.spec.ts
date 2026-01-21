import { HttpException, HttpStatus } from '@nestjs/common';
import { TmdbController } from './tmdb.controller';
import { TmdbMsClient } from './tmdb-ms.client';

/**
 * Helper :
 *  Exécute une fonction
 *  Vérifie qu’elle lève une HttpException
 *  Vérifie le status
 *  Vérifie éventuellement qu’un bout de message est présent
 */
function expectHttpException(fn: () => any, status: number, msgPart?: string) {
  try {
    fn();
    fail('Une HttpException était attendue');
  } catch (e) {
    expect(e).toBeInstanceOf(HttpException);
    const ex = e as HttpException;

    expect(ex.getStatus()).toBe(status);

    if (msgPart) {
      const r = ex.getResponse() as any;

      let message = '';

      if (typeof r === 'string') {
        message = r;
      } else if (typeof r?.message === 'string') {
        message = r.message;
      } else if (Array.isArray(r?.message)) {
        message = r.message.join(', ');
      } else {
        message = JSON.stringify(r);
      }

      expect(message).toContain(msgPart);
    }
  }
}

describe('TmdbController (gateway be-bg)', () => {
  let controller: TmdbController;

  const msMock: jest.Mocked<TmdbMsClient> = {
    get: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TmdbController(msMock);
  });

  // GET /tmdb/movies?ids=...
  describe('getMovies', () => {
    it('doit refuser si ids est manquant', () => {
      // on passe une chaîne vide => équivalent pour "if (!ids)".
      expectHttpException(
        () => controller.getMovies('' as any),
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
      msMock.get.mockResolvedValueOnce([] as any);

      await controller.getMovies(' 1, 2,abc, 3 ');

      expect(msMock.get).toHaveBeenCalledWith('/tmdb/movies', { ids: '1,2,3' });
    });
  });

  // GET /tmdb/films/populaires
  describe('getPopularMovies', () => {
    it('doit forward vers /tmdb/films/populaires', async () => {
      msMock.get.mockResolvedValueOnce([] as any);

      await controller.getPopularMovies();

      expect(msMock.get).toHaveBeenCalledWith('/tmdb/films/populaires');
    });
  });

  // GET /tmdb/recherche?query=...
  describe('rechercherFilms', () => {
    it('doit refuser si query manquant', () => {
      expectHttpException(
        () => controller.rechercherFilms('' as any),
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
      msMock.get.mockResolvedValueOnce([] as any);

      await controller.rechercherFilms('batman');

      expect(msMock.get).toHaveBeenCalledWith('/tmdb/recherche', { query: 'batman' });
    });
  });

  // GET /tmdb/recherche/avancee
  describe('rechercherFilmsAvancee', () => {
    it('doit refuser si aucun critère', () => {
      // Ici on veut appeler la méthode sans arguments (au lieu de passer undefined).
      // TS n’aime pas, donc on cast en "any" pour un appel "comme Nest le ferait".
      expectHttpException(
        () => (controller as any).rechercherFilmsAvancee(),
        HttpStatus.BAD_REQUEST,
        'Au moins un critère',
      );
    });

    it('doit refuser si titre < 2', () => {
      // On passe seulement le titre (au lieu de mettre undefined pour les autres)
      expectHttpException(
        () => (controller as any).rechercherFilmsAvancee('a'),
        HttpStatus.BAD_REQUEST,
        'au moins 2 caractères',
      );
    });

    it("doit refuser si annee n'est pas YYYY", () => {
      // On peut passer '' pour titre et mettre annee en 2e param.
      // (évite explicit undefined)
      expectHttpException(
        () => (controller as any).rechercherFilmsAvancee('', '20xx'),
        HttpStatus.BAD_REQUEST,
        'format YYYY',
      );
    });

    it('doit forward vers /tmdb/recherche/avancee en trimant les valeurs', async () => {
      msMock.get.mockResolvedValueOnce([] as any);

      await controller.rechercherFilmsAvancee('  Matrix ', ' 1999 ', ' Action ');

      expect(msMock.get).toHaveBeenCalledWith('/tmdb/recherche/avancee', {
        titre: 'Matrix',
        annee: '1999',
        genre: 'Action',
      });
    });
  });

  // GET /tmdb/:id
  describe('getMovie', () => {
    it('doit forward vers /tmdb/:id', async () => {
      msMock.get.mockResolvedValueOnce({} as any);

      await controller.getMovie(7);

      expect(msMock.get).toHaveBeenCalledWith('/tmdb/7');
    });
  });
});
