import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { TMDB_PATTERNS, DetailsFilm } from '@repo/types/library';
import { LibraryController } from './library.controllerGateway';

//On mock le ClientProxy (NATS) pour éviter tout vrai broker NATS
//On vérifie que le controller envoie les bons "patterns" + payloads

describe('LibraryController (Gateway)', () => {
  let controller: LibraryController;

  // On typpe le mock comme un ClientProxy mocké par Jest
  let natsMock: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    // Mock minimal : on n'a besoin que de send() ici
    // send() doit retourner un Observable (car ClientProxy.send retourne un Observable)
    natsMock = {
      send: jest.fn(),
      emit: jest.fn(),
    } as any;

    // On crée un module de test Nest qui instancie le controller
    // et lui injecte notre mock à la place du vrai NATS client.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LibraryController],
      providers: [
        {
          provide: 'NATS_SERVICE', // token utilisé dans le controller: @Inject('NATS_SERVICE')
          useValue: natsMock,
        },
      ],
    }).compile();

    controller = module.get(LibraryController);
  });

  afterEach(() => {
    // Nettoyage des mocks entre chaque test
    jest.clearAllMocks();
  });

  describe('getPlusieursFilms', () => {
    it('doit parser ids "1,2,3" en [1,2,3] et envoyer TMDB_PATTERNS.MOVIES', async () => {
      // Réponse fake que "ms-tmdb" renverrait
      const mockResponse: DetailsFilm[] = [
        {
          id: 1,
          titre: 'Test',
          resume: '',
          date_sortie: '',
          affiche_url: null,
          note_moyenne: 8,
        },
      ];

      // On dit: quand le controller appelle nats.send(...),
      // le mock renvoie un Observable contenant mockResponse
      natsMock.send.mockReturnValue(of(mockResponse));

      // On appelle la méthode du controller
      const result = await controller.getPlusieursFilms({ ids: '1,2,3' } as any);

      // On vérifie que send() a été appelé avec le bon pattern + payload
      expect(natsMock.send).toHaveBeenCalledWith(TMDB_PATTERNS.MOVIES, {
        ids: [1, 2, 3],
      });

      // On vérifie la valeur renvoyée au caller (front via gateway)
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPopularMovies', () => {
    it('doit envoyer TMDB_PATTERNS.POPULAIRES avec payload vide {}', async () => {
      const mockResponse: DetailsFilm[] = [];

      natsMock.send.mockReturnValue(of(mockResponse));

      const result = await controller.getPopularMovies();

      expect(natsMock.send).toHaveBeenCalledWith(TMDB_PATTERNS.POPULAIRES, {});
      expect(result).toEqual(mockResponse);
    });
  });

  describe('rechercherFilms', () => {
    it('doit envoyer TMDB_PATTERNS.RECHERCHE avec {query}', async () => {
      const mockResponse: DetailsFilm[] = [];

      natsMock.send.mockReturnValue(of(mockResponse));

      const result = await controller.rechercherFilms({ query: 'batman' } as any);

      expect(natsMock.send).toHaveBeenCalledWith(TMDB_PATTERNS.RECHERCHE, {
        query: 'batman',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('rechercherFilmsAvancee', () => {
    it('doit envoyer TMDB_PATTERNS.RECHERCHE_AVANCEE avec les filtres', async () => {
      const mockResponse: DetailsFilm[] = [];
      natsMock.send.mockReturnValue(of(mockResponse));

      const dto = { titre: 'Matrix', annee: '1999', genre: 'Action' };

      const result = await controller.rechercherFilmsAvancee(dto as any);

      expect(natsMock.send).toHaveBeenCalledWith(
        TMDB_PATTERNS.RECHERCHE_AVANCEE,
        dto,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMovie', () => {
    it('doit envoyer TMDB_PATTERNS.DETAILS avec {id}', async () => {
      const mockResponse: DetailsFilm = {
        id: 1,
        titre: 'Test',
        resume: '',
        date_sortie: '',
        affiche_url: null,
        note_moyenne: 7,
      };

      natsMock.send.mockReturnValue(of(mockResponse));

      // Ici, on appelle getMovie directement
      // (ParseIntPipe n'est pas testé dans un test unitaire "direct" comme ça)
      const result = await controller.getMovie(1);

      expect(natsMock.send).toHaveBeenCalledWith(TMDB_PATTERNS.DETAILS, { id: 1 });
      expect(result).toEqual(mockResponse);
    });
  });
});
