"use client"
import { useEffect, useState } from "react";
import { Header, Footer , BarreRecherche, DetailsFilm, CarteFilms} from "../components/utils";
export function usefilms() {
  const [films, setFilms] = useState<DetailsFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        console.log('Appel API films populaires...');
        
        const response = await fetch('http://localhost:3333/tmdb/films/populaires');
        
        console.log('📡 Status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Films reçus:', data.length);
        
        setFilms(data);
        setError(null);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err instanceof Error ? err.message : 'Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    fetchFilms();
  }, []);

  return { films, loading, error };
}
function paragraphes() {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-4">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
        Bienvenue sur CinéPote
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
        Ciné'Pote est une plateforme pour lister ses films vus et organiser des soirées cinéma entre amis. 
        Chaque participant propose une sélection de films, les listes sont fusionnées, 
        puis chacun classe la liste finale pour dégager un top commun et choisir le film de la soirée.
      </p>
    </div>
  );
}
function Home() {
  const { films, loading, error } = usefilms();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      <Header />
      
      <main className="flex-grow flex flex-col items-center justify-center px-16 py-32 space-y-8">
        {BarreRecherche()}
        {paragraphes()}
        <div className="w-full max-w-7xl mt-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Films populaires
          </h2>
          
          {loading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {error && (
            <div className="text-red-600 text-center">{error}</div>
          )}
          
          {!loading && !error && (
            <div className="space-y-6">
              {films.map(film => (
                <CarteFilms key={film.id} {...film} />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
export default Home;