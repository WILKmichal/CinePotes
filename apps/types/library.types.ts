/**
 * Représente les informations essentielles d’un film
 * récupéré depuis l’API TMDB.
 */
export interface DetailsFilm {
  // Identifiant unique du film
  id: number;
  titre: string;
  resume: string;
  date_sortie: string;
  affiche_url: string | null;
  note_moyenne: number;
}
export const TMDB_PATTERNS = {
  MOVIES: 'library.movies',
  POPULAIRES: 'library.films.populaires',
  RECHERCHE: 'library.recherche',
  RECHERCHE_AVANCEE: 'library.recherche.avancee',
  DETAILS: 'library.details',
} as const;

export type TmdbStatusMessage = { status_message?: string };

export type TmdbMovie = {
  id: number;
  title: string;
  overview?: string | null;
  release_date?: string | null;
  poster_path?: string | null;
  vote_average?: number | null;
  genre_ids?: number[];
};

export type TmdbListResponse<T> = {
  results: T[];
};

export type TmdbGenresResponse = {
  genres: Array<{ id: number; name: string }>;
};

export type RechercheAvanceeFiltres = {
  titre?: string;
  annee?: string;
  genre?: string;
};

export type DiscoverMovieParams = {
  api_key: string;
  language: string;
  sort_by: 'popularity.desc';
  page: number;
  primary_release_year?: string;
  with_genres?: number;
};
