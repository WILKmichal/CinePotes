import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface DetailsFilm {
  id: number;
  titre: string;
  resume: string;
  date_sortie: string;
  affiche_url: string | null;
  note_moyenne: number;
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
function BarreRecherche() {
  const router = useRouter();
  const [requete, setQuery] = useState('');
  const [defilresultat, setShowResults] = useState(false);
  const { resultats, loading, error } = RechercheFilms(requete);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Recherche soumise:', requete);
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6 relative">
      <div className="w-full max-w-lg">
        <form className="mt-5 sm:flex sm:items-center" onSubmit={handleSubmit}>
          <div className="relative w-full">
            <input
              id="q"
              name="q"
              className="inline w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-3 leading-5 placeholder-gray-500 focus:border-indigo-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              placeholder="Rechercher un film... (min. 3 lettres)"
              type="search"
              autoComplete="off"
              value={requete}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              onFocus={() => setShowResults(true)}
            />

            {defilresultat && requete.length >= 3 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
                {loading && (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-sm">Recherche en cours...</p>
                  </div>
                )}

                {error && (
                  <div className="p-4 text-center text-red-600">
                    {error}
                  </div>
                )}

                {!loading && !error && resultats.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    Aucun film trouvé
                  </div>
                )}

                {!loading && !error && resultats.length > 0 && (
                  <ul>
                    {resultats.map((film) => (
                      <li
                        key={film.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setShowResults(false);
                          router.push(`/films/${film.id}`);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {film.affiche_url ? (
                            <img
                              src={film.affiche_url}
                              alt={film.titre}
                              className="w-12 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              Pas d'image
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {film.titre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {film.date_sortie ? new Date(film.date_sortie).getFullYear() : 'N/A'}
                              {' • '}
                              ⭐ {film.note_moyenne.toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Rechercher
          </button>
        </form>
      </div>
    </div>
  );
}
function RechercheFilms(requete: string) {
  const [resultats, setResultats] = useState<DetailsFilm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requete.length < 3) {
      setResultats([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`🔍 Recherche: "${requete}"`);
        
        const response = await fetch(
          `http://localhost:3333/tmdb/recherche?query=${encodeURIComponent(requete)}`
        );

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }

        const data = await response.json();
        console.log(`${data.length} résultat(s) trouvé(s)`);
        
        setResultats(data);
      } catch (err) {
        console.error('Erreur recherche:', err);
        setError(err instanceof Error ? err.message : 'Erreur de recherche');
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [requete]);

  return { resultats, loading, error };
}
function CarteFilms({ id, titre, resume, date_sortie, affiche_url, note_moyenne }: DetailsFilm) {
  const router = useRouter();

  return (
    <article
      onClick={() => router.push(`/films/${id}`)}
      className="cursor-pointer bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
    >
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
            <span className="text-sm text-gray-500">
              {date_sortie ? new Date(date_sortie).toLocaleDateString() : "N/A"}
            </span>
            <span className="text-sm font-medium text-yellow-500">
              {typeof note_moyenne === "number" ? note_moyenne.toFixed(1) : "N/A"}/10
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export { Header, Footer , BarreRecherche ,RechercheFilms, CarteFilms };