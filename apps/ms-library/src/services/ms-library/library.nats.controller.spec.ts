import { Test, TestingModule } from '@nestjs/testing';
import { TmdbNatsController } from './library.nats.controller';
import { TmdbService } from './library.service';
import { DetailsFilm } from '../../../../types/tmdb.types';

//  On mock TmdbService (aucun appel TMDB / Redis)
//  On vérifie que chaque handler appelle la bonne méthode avec les bons parametres
describe('TmdbNatsController', () => {
  let controller: TmdbNatsController;

  // Mock de service : on ne teste pas le service ici, seulement le routing
  const tmdbServiceMock = {
    obtenirDetailsFilm: jest.fn(),
    obtenirPlusieursFilms: jest.fn(),
    obtenirFilmsPopulaires: jest.fn(),
    rechercherFilms: jest.fn(),
    rechercherFilmsAvancee: jest.fn(),
  };

  beforeEach(async () => {
    // On construit un module de test Nest
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TmdbNatsController],
      providers: [
        {
          // injection du vrai token Nest (classe)
          provide: TmdbService,
          // remplacé par notre mock
          useValue: tmdbServiceMock,
        },
      ],
    }).compile();

    controller = module.get(TmdbNatsController);
  });

  afterEach(() => {
    // Reset des appels entre les tests
    jest.clearAllMocks();
  });

  describe('obtenirDetails', () => {
    it('doit appeler tmdb.obtenirDetailsFilm avec data.id', async () => {
      // Réponse mockée du service
      const film: DetailsFilm = {
        id: 10,
        titre: 'Interstellar',
        resume: '...',
        date_sortie: '2014-11-07',
        affiche_url: null,
        note_moyenne: 9,
      };

      // Le service retourne une Promise (ou valeur) : on mock la résolution
      tmdbServiceMock.obtenirDetailsFilm.mockResolvedValueOnce(film);

      // Appel du handler (comme si NATS envoyait {id:10})
      const result = await controller.obtenirDetails({ id: 10 });

      // Vérification routing
      expect(tmdbServiceMock.obtenirDetailsFilm).toHaveBeenCalledTimes(1);
      expect(tmdbServiceMock.obtenirDetailsFilm).toHaveBeenCalledWith(10);

      // Vérification retour
      expect(result).toEqual(film);
    });
  });

  describe('obtenirMovies', () => {
    it('doit appeler tmdb.obtenirPlusieursFilms avec data.ids', async () => {
      const films: DetailsFilm[] = [
        {
          id: 1,
          titre: 'A',
          resume: '',
          date_sortie: '',
          affiche_url: null,
          note_moyenne: 7,
        },
        {
          id: 2,
          titre: 'B',
          resume: '',
          date_sortie: '',
          affiche_url: null,
          note_moyenne: 8,
        },
      ];

      tmdbServiceMock.obtenirPlusieursFilms.mockResolvedValueOnce(films);

      const result = await controller.obtenirMovies({ ids: [1, 2] });

      expect(tmdbServiceMock.obtenirPlusieursFilms).toHaveBeenCalledTimes(1);
      expect(tmdbServiceMock.obtenirPlusieursFilms).toHaveBeenCalledWith([
        1, 2,
      ]);
      expect(result).toEqual(films);
    });
  });

  describe('obtenirPopulaires', () => {
    it('doit appeler tmdb.obtenirFilmsPopulaires', async () => {
      const films: DetailsFilm[] = [];

      tmdbServiceMock.obtenirFilmsPopulaires.mockResolvedValueOnce(films);

      const result = await controller.obtenirPopulaires();

      expect(tmdbServiceMock.obtenirFilmsPopulaires).toHaveBeenCalledTimes(1);
      expect(tmdbServiceMock.obtenirFilmsPopulaires).toHaveBeenCalledWith();
      expect(result).toEqual(films);
    });
  });

  describe('rechercher', () => {
    it('doit appeler tmdb.rechercherFilms avec data.query', async () => {
      const films: DetailsFilm[] = [];

      tmdbServiceMock.rechercherFilms.mockResolvedValueOnce(films);

      const result = await controller.rechercher({ query: 'batman' });

      expect(tmdbServiceMock.rechercherFilms).toHaveBeenCalledTimes(1);
      expect(tmdbServiceMock.rechercherFilms).toHaveBeenCalledWith('batman');
      expect(result).toEqual(films);
    });
  });

  describe('rechercherAvancee', () => {
    it('doit appeler tmdb.rechercherFilmsAvancee avec les filtres', async () => {
      const films: DetailsFilm[] = [];
      const payload = { titre: 'Matrix', annee: '1999', genre: 'Action' };

      tmdbServiceMock.rechercherFilmsAvancee.mockResolvedValueOnce(films);

      const result = await controller.rechercherAvancee(payload);

      expect(tmdbServiceMock.rechercherFilmsAvancee).toHaveBeenCalledTimes(1);
      expect(tmdbServiceMock.rechercherFilmsAvancee).toHaveBeenCalledWith(
        payload,
      );
      expect(result).toEqual(films);
    });
  });

  describe('obtenirPlusieurs', () => {
    it('doit appeler tmdb.obtenirPlusieursFilms avec data.ids', async () => {
      const films: DetailsFilm[] = [
        {
          id: 3,
          titre: 'C',
          resume: '',
          date_sortie: '',
          affiche_url: null,
          note_moyenne: 6,
        },
      ];

      tmdbServiceMock.obtenirPlusieursFilms.mockResolvedValueOnce(films);

      const result = await controller.obtenirPlusieurs({ ids: [3] });

      expect(tmdbServiceMock.obtenirPlusieursFilms).toHaveBeenCalledTimes(1);
      expect(tmdbServiceMock.obtenirPlusieursFilms).toHaveBeenCalledWith([3]);
      expect(result).toEqual(films);
    });
  });
});
