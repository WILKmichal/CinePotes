import { Test, TestingModule } from '@nestjs/testing';
import { LibraryNatsController } from './library.nats.controller';
import { LibraryService } from './library.service';
import { DetailsFilm } from '../../../../types/library.types';

//  On mock LibraryService (aucun appel TMDB / Redis)
//  On vérifie que chaque handler appelle la bonne méthode avec les bons parametres
describe('LibraryNatsController', () => {
  let controller: LibraryNatsController;

  // Mock de service : on ne teste pas le service ici, seulement le routing
  const libraryServiceMock = {
    obtenirDetailsFilm: jest.fn(),
    obtenirPlusieursFilms: jest.fn(),
    obtenirFilmsPopulaires: jest.fn(),
    rechercherFilms: jest.fn(),
    rechercherFilmsAvancee: jest.fn(),
  };

  beforeEach(async () => {
    // On construit un module de test Nest
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LibraryNatsController],
      providers: [
        {
          // injection du vrai token Nest (classe)
          provide: LibraryService,
          // remplacé par notre mock
          useValue: libraryServiceMock,
        },
      ],
    }).compile();

    controller = module.get(LibraryNatsController);
  });

  afterEach(() => {
    // Reset des appels entre les tests
    jest.clearAllMocks();
  });

  describe('obtenirDetails', () => {
    it('doit appeler library.obtenirDetailsFilm avec data.id', async () => {
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
      libraryServiceMock.obtenirDetailsFilm.mockResolvedValueOnce(film);

      // Appel du handler (comme si NATS envoyait {id:10})
      const result = await controller.obtenirDetails({ id: 10 });

      // Vérification routing
      expect(libraryServiceMock.obtenirDetailsFilm).toHaveBeenCalledTimes(1);
      expect(libraryServiceMock.obtenirDetailsFilm).toHaveBeenCalledWith(10);

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

      libraryServiceMock.obtenirPlusieursFilms.mockResolvedValueOnce(films);

      const result = await controller.obtenirMovies({ ids: [1, 2] });

      expect(libraryServiceMock.obtenirPlusieursFilms).toHaveBeenCalledTimes(1);
      expect(libraryServiceMock.obtenirPlusieursFilms).toHaveBeenCalledWith([
        1, 2,
      ]);
      expect(result).toEqual(films);
    });
  });

  describe('obtenirPopulaires', () => {
    it('doit appeler tmdb.obtenirFilmsPopulaires', async () => {
      const films: DetailsFilm[] = [];

      libraryServiceMock.obtenirFilmsPopulaires.mockResolvedValueOnce(films);

      const result = await controller.obtenirPopulaires();

      expect(libraryServiceMock.obtenirFilmsPopulaires).toHaveBeenCalledTimes(1);
      expect(libraryServiceMock.obtenirFilmsPopulaires).toHaveBeenCalledWith();
      expect(result).toEqual(films);
    });
  });

  describe('rechercher', () => {
    it('doit appeler tmdb.rechercherFilms avec data.query', async () => {
      const films: DetailsFilm[] = [];

      libraryServiceMock.rechercherFilms.mockResolvedValueOnce(films);

      const result = await controller.rechercher({ query: 'batman' });

      expect(libraryServiceMock.rechercherFilms).toHaveBeenCalledTimes(1);
      expect(libraryServiceMock.rechercherFilms).toHaveBeenCalledWith('batman');
      expect(result).toEqual(films);
    });
  });

  describe('rechercherAvancee', () => {
    it('doit appeler tmdb.rechercherFilmsAvancee avec les filtres', async () => {
      const films: DetailsFilm[] = [];
      const payload = { titre: 'Matrix', annee: '1999', genre: 'Action' };

      libraryServiceMock.rechercherFilmsAvancee.mockResolvedValueOnce(films);

      const result = await controller.rechercherAvancee(payload);

      expect(libraryServiceMock.rechercherFilmsAvancee).toHaveBeenCalledTimes(1);
      expect(libraryServiceMock.rechercherFilmsAvancee).toHaveBeenCalledWith(
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

      libraryServiceMock.obtenirPlusieursFilms.mockResolvedValueOnce(films);

      const result = await controller.obtenirPlusieurs({ ids: [3] });

      expect(libraryServiceMock.obtenirPlusieursFilms).toHaveBeenCalledTimes(1);
      expect(libraryServiceMock.obtenirPlusieursFilms).toHaveBeenCalledWith([3]);
      expect(result).toEqual(films);
    });
  });
});
