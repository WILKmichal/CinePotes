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
