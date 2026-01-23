"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/utils";

const API_URL = process.env.NEXT_PUBLIC_API_BG_URL ?? "http://localhost:3002";
const API_TMDB = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

interface Liste {
  id: string;
  nom: string;
  films: number[];
}

interface FilmInfo {
  id: number;
  titre: string;
}

export default function MesListesPage() {
  const router = useRouter();
  const [listes, setListes] = useState<Liste[]>([]);
  const [filmsCache, setFilmsCache] = useState<Record<number, FilmInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  };

  useEffect(() => {
    const fetchListes = async () => {
      const token = getToken();
      if (!token) {
        setError("Vous devez être connecté pour voir vos listes");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/lists/with-films`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            setError("Session expirée. Veuillez vous reconnecter.");
            return;
          }
          throw new Error("Erreur lors du chargement");
        }

        const data = await res.json();
        setListes(data);

        const allTmdbIds = data.flatMap((l: Liste) => l.films);
        const uniqueTmdbIds = [...new Set(allTmdbIds)] as number[];

        for (const tmdbId of uniqueTmdbIds) {
          fetchFilmInfo(tmdbId);
        }
      } catch {
        setError("Impossible de charger vos listes");
      } finally {
        setLoading(false);
      }
    };

    fetchListes();
  }, []);

  const fetchFilmInfo = async (tmdbId: number) => {
    try {
      const res = await fetch(`${API_TMDB}/tmdb/${tmdbId}`);
      if (res.ok) {
        const data = await res.json();
        setFilmsCache((prev) => ({
          ...prev,
          [tmdbId]: {
            id: data.id,
            titre: data.titre,
          },
        }));
      }
    } catch {
      console.error(`Erreur chargement film ${tmdbId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-gray-600">Chargement...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Se connecter
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes Listes</h1>

          {listes.length === 0 ? (
            <p className="text-gray-500">Vous n&apos;avez pas encore de liste.</p>
          ) : (
            <div className="space-y-6">
              {listes.map((liste) => (
                <div key={liste.id}>
                  <h2 className="text-xl font-semibold text-gray-900">{liste.nom}</h2>
                  {liste.films.length === 0 ? (
                    <p className="text-gray-400 ml-4">- (vide)</p>
                  ) : (
                    <ul className="ml-4">
                      {liste.films.map((tmdbId) => (
                        <li key={tmdbId} className="text-gray-700">
                          - {filmsCache[tmdbId]?.titre || `Film #${tmdbId}`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
