export const LIST_PATTERNS = {
  FIND_ALL_BY_USER: 'list.findAllByUser',
  FIND_ALL_WITH_FILMS: 'list.findAllByUserWithFilms',
  FIND_ONE: 'list.findOne',
  GET_FILMS: 'list.getFilmsInList',
  CREATE: 'list.create',
  UPDATE: 'list.update',
  DELETE: 'list.delete',
  ADD_FILM: 'list.addFilmToList',
  REMOVE_FILM: 'list.removeFilmFromList',
} as const;
