export interface FindAllByUserPayload {
  userId: string;
}

export interface FindAllByUserWithFilmsPayload {
  userId: string;
}

export interface FindOnePayload {
  listeId: string;
  userId: string;
}

export interface GetFilmsInListPayload {
  listeId: string;
  userId: string;
}

export interface CreateListPayload {
  userId: string;
  nom: string;
  description?: string;
}

export interface UpdateListPayload {
  listeId: string;
  userId: string;
  nom?: string;
  description?: string;
}

export interface DeleteListPayload {
  listeId: string;
  userId: string;
}

export interface AddFilmToListPayload {
  listeId: string;
  tmdbId: number;
  userId: string;
}

export interface RemoveFilmFromListPayload {
  listeId: string;
  tmdbId: number;
  userId: string;
}
