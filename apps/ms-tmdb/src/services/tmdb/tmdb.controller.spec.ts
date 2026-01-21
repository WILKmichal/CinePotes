import { HttpException, HttpStatus } from '@nestjs/common';
import { TmdbController } from './tmdb.controller';
import { TmdbService } from './tmdb.service';

/**
 * Helper  :
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

describe('TmdbController (ms-tmdb)', () => {
  let controller: TmdbController;

  const serviceMock: jest.Mocked<TmdbService> = {
    obtenirPlusieursFilms: jest.fn(),
    obtenirFilmsPopulaires: jest.fn(),
    rechercherFilms: jest.fn(),
    rechercherFilmsAvancee: jest.fn(),
    obtenirDetailsFilm: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TmdbController(serviceMock);
  });

  describe('GET /tmdb/movies', () => {
    it('doit refuser si ids est manquant', () => {
      expectHttpException(
        () => controller.getMovies('' as any),
        HttpStatus.BAD_REQUEST,
        'ids est requis',
      );
    });

    it('doit refuser si ids ne contient aucun nombre valide', () => {
      expectHttpException(
        () => controller.getMovies('abc, def'),
        HttpStatus.BAD_REQUEST,
        'ids invalide',
      );
    });

    it('doit parser ids et appeler obtenirPlusieursFilms', async () => {
      serviceMock.obtenirPlusieursFilms.mockResolvedValueOnce([] as any);

      await controller.getMovies(' 1, 2,abc, 3 ');
      expect(serviceMock.obtenirPlusieursFilms).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('GET /tmdb/films/populaires', () => {
    it('doit appeler obtenirFilmsPopulaires', async () => {
      serviceMock.obtenirFilmsPopulaires.mockResolvedValueOnce([] as any);

      await controller.getPopularMovies();
      expect(serviceMock.obtenirFilmsPopulaires).toHaveBeenCalled();
    });
  });

  describe('GET /tmdb/recherche', () => {
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

    it('doit appeler rechercherFilms du service si query valide', async () => {
      serviceMock.rechercherFilms.mockResolvedValueOnce([] as any);

      await controller.rechercherFilms('batman');
      expect(serviceMock.rechercherFilms).toHaveBeenCalledWith('batman');
    });
  });

  describe('GET /tmdb/recherche/avancee', () => {
    it('doit refuser si aucun critère', () => {
      expectHttpException(
        () => (controller as any).rechercherFilmsAvancee(),
        HttpStatus.BAD_REQUEST,
        'Au moins un critère',
      );
    });

    it('doit refuser si titre existe mais < 2 caractères', () => {
      expectHttpException(
        () => (controller as any).rechercherFilmsAvancee('a'),
        HttpStatus.BAD_REQUEST,
        'au moins 2 caractères',
      );
    });

    it("doit refuser si l'année n'est pas au format YYYY", () => {
      // On passe '' pour titre (pas undefined), puis annee en 2e param
      expectHttpException(
        () => (controller as any).rechercherFilmsAvancee('', '20xx'),
        HttpStatus.BAD_REQUEST,
        'format YYYY',
      );
    });

    it('doit appeler rechercherFilmsAvancee du service avec trim', async () => {
      serviceMock.rechercherFilmsAvancee.mockResolvedValueOnce([] as any);

      await controller.rechercherFilmsAvancee('  Matrix ', ' 1999 ', ' Action ');
      expect(serviceMock.rechercherFilmsAvancee).toHaveBeenCalledWith({
        titre: 'Matrix',
        annee: '1999',
        genre: 'Action',
      });
    });
  });

  describe('GET /tmdb/:id', () => {
    it('doit appeler obtenirDetailsFilm', async () => {
      serviceMock.obtenirDetailsFilm.mockResolvedValueOnce({} as any);

      await controller.getMovie(12);
      expect(serviceMock.obtenirDetailsFilm).toHaveBeenCalledWith(12);
    });
  });
});
