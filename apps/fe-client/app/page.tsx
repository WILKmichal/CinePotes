"use client";

import { useEffect, useState } from "react";
import {Header,Footer,BarreRecherche,CarteFilms,DetailsFilm,} from "../components/utils";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export function useFilms() {
  const [films, setFilms] = useState<DetailsFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        const response = await fetch(
          `${API_URL}/tmdb/films/populaires`
        );

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data: DetailsFilm[] = await response.json();
        setFilms(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de connexion");
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
        Ciné&apos;Pote est une plateforme pour lister ses films vus et organiser des
        soirées cinéma entre amis. Chaque participant propose une sélection de
        films, les listes sont fusionnées, puis chacun classe la liste finale
        pour dégager un top commun et choisir le film de la soirée.
      </p>
    </div>
  );
}

export default function Home() {
  const { films, loading, error } = useFilms();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      <Header />

      <main className="flex-grow flex flex-col items-center justify-center px-16 py-32 space-y-8">
        <BarreRecherche />
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

          {error && <div className="text-red-600 text-center">{error}</div>}

          {!loading && !error && (
            <div className="space-y-6">
              {films.map((film) => (
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
