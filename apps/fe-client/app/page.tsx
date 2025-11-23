"use client"
import { useEffect, useState } from "react";
        

interface DetailsFilm {
  id: number;
  titre: string;
  resume: string;
  date_sortie: string;
  affiche_url: string | null;
  note_moyenne: number;
}
export function useMovies() {
  const [films, setFilms] = useState<DetailsFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        console.log('🔍 Appel API films populaires...');
        
        const response = await fetch('http://localhost:3333/tmdb/films/populaires');
        
        console.log('📡 Status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Films reçus:', data.length);
        
        setFilms(data);
        setError(null);
      } catch (err) {
        console.error('❌ Erreur:', err);
        setError(err instanceof Error ? err.message : 'Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    fetchFilms();
  }, []);

  return { films, loading, error };
}
function Header() {
  return <header className="fixed inset-x-0 top-0 z-30 mx-auto w-full max-w-screen-md border border-gray-100 bg-white/80 py-3 shadow backdrop-blur-lg md:top-6 md:rounded-3xl lg:max-w-screen-lg">
            <div className="px-4">
                <div className="flex items-center justify-between">
                    <div className="flex shrink-0">
                        <a aria-current="page" className="flex items-center" href="/">
                            <img className="h-7 w-auto" src="https://img.icons8.com/?size=100&id=11860&format=png&color=000000" alt="CinePotes" />
                            <p className="sr-only">Website Title</p>
                        </a>
                    </div>
                    <div className="hidden md:flex md:items-center md:justify-center md:gap-5">
                        <a aria-current="page"
                            className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                            href="/">Home</a>
                            <a className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                            href="#">Contact</a>
                        <a className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                            href="#">About us</a>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        <a className="hidden items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-all duration-150 hover:bg-gray-50 sm:inline-flex"
                            href="/login">Sign in</a>
                        <a className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            href="/login">Login</a>
                    </div>
                </div>
            </div>
        </header>;
}
function Footer() {
  return (
    <footer className="w-full flex justify-center mt-16">
  <div className="flex flex-col items-center w-full bg-white border-t border-gray-200 shadow-lg p-8 space-y-8">
    <nav className="flex justify-center flex-wrap gap-6 text-gray-500 font-medium">
      <a className="hover:text-gray-900" href="#">Home</a>
      <a className="hover:text-gray-900" href="#">About</a>
      <a className="hover:text-gray-900" href="#">Services</a>
      <a className="hover:text-gray-900" href="#">Media</a>
      <a className="hover:text-gray-900" href="#">Gallery</a>
      <a className="hover:text-gray-900" href="#">Contact</a>
    </nav>

    <div className="flex justify-center space-x-5">
      <a href="#"><img src="https://img.icons8.com/fluent/30/000000/facebook-new.png"/></a>
      <a href="#"><img src="https://img.icons8.com/fluent/30/000000/linkedin-2.png"/></a>
      <a href="#"><img src="https://img.icons8.com/fluent/30/000000/instagram-new.png"/></a>
      <a href="#"><img src="https://img.icons8.com/fluent/30/000000/facebook-messenger--v2.png"/></a>
      <a href="#"><img src="https://img.icons8.com/fluent/30/000000/twitter.png"/></a>
    </div>

    <p className="text-center text-gray-700 font-medium">
      &copy; 2022 Company Ltd. All rights reserved.
    </p>
  </div>
</footer>
  );
}
function barrecherche() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <form className="mt-5 sm:flex sm:items-center">
          <input
            id="q"
            name="q"
            className="inline w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-3 leading-5 placeholder-gray-500 focus:border-indigo-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            placeholder="Keyword"
            type="search"
            autoFocus
            defaultValue=""
          />
          <button
            type="submit"
            className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
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

/* MovieCard component added to fix "MovieCard" not found error */
function MovieCard({ id, titre, resume, date_sortie, affiche_url, note_moyenne }: DetailsFilm) {
  return (
    <article className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex gap-4">
        {affiche_url ? (
          <img src={affiche_url} alt={titre} className="w-24 h-36 object-cover rounded flex-shrink-0" />
        ) : (
          <div className="w-24 h-36 bg-gray-200 rounded flex items-center justify-center text-gray-500 flex-shrink-0">
            No Image
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{titre}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-3">{resume}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">{date_sortie ? new Date(date_sortie).toLocaleDateString() : "N/A"}</span>
            <span className="text-sm font-medium text-yellow-500">{typeof note_moyenne === "number" ? note_moyenne.toFixed(1) : "N/A"}/10</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function Home() {
  const { films, loading, error } = useMovies();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      <Header />
      
      <main className="flex-grow flex flex-col items-center justify-center px-16 py-32 space-y-8">
        {barrecherche()}
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
                <MovieCard key={film.id} {...film} />
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
