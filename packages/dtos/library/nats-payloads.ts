export interface LibraryDetailsPayload {
  id: number;
}

export interface LibraryMoviesPayload {
  ids: number[];
}

export interface LibrarySearchPayload {
  query: string;
}

export interface LibraryAdvancedSearchPayload {
  titre?: string;
  annee?: string;
  genre?: string;
}