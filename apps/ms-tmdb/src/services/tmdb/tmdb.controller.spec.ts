import { HttpException, HttpStatus } from '@nestjs/common';
import { TmdbController } from './tmdb.controller';
import { TmdbService } from './tmdb.service';

function expectHttpException(
  fn: () => unknown,
  status: number,
  msgPart?: string,
): void {
  try {
    fn();
    fail('Une HttpException était attendue');
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    const ex = error as HttpException;

    expect(ex.getStatus()).toBe(status);

    if (!msgPart) return;

    const response = ex.getResponse();

    let message: string;

    if (typeof response === 'string') {
      message = response;
    } else if (
      typeof response === 'object' &&
      response !== null &&
      
      'message' in response
    ) {
      const msg = (response as { message: string | string[] }).message;
      message = Array.isArray(msg) ? msg.join(', ') : msg;
    } else {
      message = JSON.stringify(response);
    }

    expect(message).toContain(msgPart);
  }
}

describe('TmdbController (ms-tmdb)', () => {
  let controller: TmdbController;

  const serviceMock = {
    obtenirPlusieursFilms: jest.fn(),
    obtenirFilmsPopulaires: jest.fn(),
    rechercherFilms: jest.fn(),
    rechercherFilmsAvancee: jest.fn(),
    obtenirDetailsFilm: jest.fn(),
  } as Partial<jest.Mocked<TmdbService>> as jest.Mocked<TmdbService>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TmdbController(serviceMock);
  });

  describe('GET /tmdb/movies', () => {
    it('doit refuser si ids est manquant', () => {
      expectHttpException(
        () => controller.getMovies(''),
        HttpStatus.BAD_REQUEST,
        'ids est requis',
      );
    });

    it('doit refuser si ids invalide', () => {
      expectHttpException(
        () => controller.getMovies('abc, def'),
        HttpStatus.BAD_REQUEST,
        'ids invalide',
      );
    });

    it('doit parser ids et appeler obtenirPlusieursFilms', async () => {
      const spy = jest
        .spyOn(serviceMock, 'obtenirPlusieursFilms')
        .mockResolvedValueOnce([]);

      await controller.getMovies(' 1, 2,abc, 3 ');

      expect(spy).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('GET /tmdb/films/populaires', () => {
    it('doit appeler obtenirFilmsPopulaires', async () => {
      const spy = jest
        .spyOn(serviceMock, 'obtenirFilmsPopulaires')
        .mockResolvedValueOnce([]);

      await controller.getPopularMovies();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /tmdb/recherche', () => {
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

    it('doit appeler rechercherFilms si query valide', async () => {
      const spy = jest
        .spyOn(serviceMock, 'rechercherFilms')
        .mockResolvedValueOnce([]);

      await controller.rechercherFilms('batman');

      expect(spy).toHaveBeenCalledWith('batman');
    });
  });

  describe('GET /tmdb/recherche/avancee', () => {
    it('doit refuser si aucun critère', () => {
      expectHttpException(
        () => controller.rechercherFilmsAvancee('', '', ''),
        HttpStatus.BAD_REQUEST,
        'Au moins un critère',
      );
    });

    it('doit refuser si titre < 2 caractères', () => {
      expectHttpException(
        () => controller.rechercherFilmsAvancee('a', '', ''),
        HttpStatus.BAD_REQUEST,
        'au moins 2 caractères',
      );
    });

    it("doit refuser si l'année n'est pas YYYY", () => {
      expectHttpException(
        () => controller.rechercherFilmsAvancee('', '20xx', ''),
        HttpStatus.BAD_REQUEST,
        'format YYYY',
      );
    });

    it('doit appeler rechercherFilmsAvancee avec trim', async () => {
      const spy = jest
        .spyOn(serviceMock, 'rechercherFilmsAvancee')
        .mockResolvedValueOnce([]);

      await controller.rechercherFilmsAvancee(
        '  Matrix ',
        ' 1999 ',
        ' Action ',
      );

      expect(spy).toHaveBeenCalledWith({
        titre: 'Matrix',
        annee: '1999',
        genre: 'Action',
      });
    });
  });

  describe('GET /tmdb/:id', () => {
    it('doit appeler obtenirDetailsFilm', async () => {
      const spy = jest
        .spyOn(serviceMock, 'obtenirDetailsFilm')
        .mockResolvedValueOnce({
          id: 12,
          titre: 'Film',
          resume: '',
          date_sortie: '',
          affiche_url: null,
          note_moyenne: 0,
        });

      await controller.getMovie(12);

      expect(spy).toHaveBeenCalledWith(12);
    });
  });
});
