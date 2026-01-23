import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3000";
const CALLBACK_URL = "http://localhost:3001/auth/callback";

export interface DetailsFilm {
  id: number;
  titre: string;
  resume: string;
  date_sortie: string;
  affiche_url: string | null;
  note_moyenne: number;
}

export interface FiltresRechercheFilms {
  titre: string;
  genre: string;
  annee: string;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
function decodeJwt(token: string) {
  try {
    const payload = token.split(".")[1];

    const base64 = payload
      .replaceAll("-", "+")
      .replaceAll("_", "/");

    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) =>
          "%" + ("00" + c.codePointAt(0)!.toString(16)).slice(-2)
        )
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function Header() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setDisplayName(null);
      return;
    }

    const payload = decodeJwt(token);
    setDisplayName(payload?.username ?? null);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.replace("/");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 mx-auto w-full max-w-screen-md border border-gray-100 bg-white/80 py-3 shadow backdrop-blur-lg md:top-6 md:rounded-3xl lg:max-w-screen-lg">
      <div className="px-4">
        <div className="flex items-center justify-between">
          <div className="flex shrink-0">
            <Link href="/" className="flex items-center" aria-current="page">
              <img
                className="h-7 w-auto"
                src="https://img.icons8.com/?size=100&id=11860&format=png&color=000000"
                alt="CinePotes"
              />
              <p className="sr-only">CinePotes</p>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:justify-center md:gap-5">
            <Link
              className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-100"
              href="/"
            >
              Home
            </Link>
            <Link
              className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-100"
              href="/lobby"
            >
              Lobby
            </Link>
            <Link
              className="inline-block rounded-lg px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-100"
              href="/about"
            >
              About us
            </Link>
          </div>

          <div className="flex items-center justify-end gap-3">
            {displayName ? (
              <>
                <span className="text-sm font-semibold text-gray-900">
                  {displayName}
                </span>

                <button
                  onClick={handleLogout}
                  className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow ring-1 ring-gray-300 hover:bg-gray-50"
                  href={`${ADMIN_URL}?redirect=${encodeURIComponent(CALLBACK_URL)}`}
                >
                  Sign in
                </Link>

                <Link
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                  href={`${ADMIN_URL}?redirect=${encodeURIComponent(CALLBACK_URL)}`}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full flex justify-center mt-16">
  <div className="flex flex-col items-center w-full bg-white border-t border-gray-200 shadow-lg p-8 space-y-8">
    <nav className="flex justify-center flex-wrap gap-6 text-gray-500 font-medium">
      <Link className="hover:text-gray-900" href="/">Home</Link>
      <Link className="hover:text-gray-900" href="/Lobby">Lobby</Link>
      <Link className="hover:text-gray-900" href="/about">About</Link>
      <Link className="hover:text-gray-900" href="/Service">Services</Link>
    </nav>
    <div className="flex justify-center space-x-5">
      <a href="https://instagram.com"><img src="https://img.icons8.com/fluent/30/000000/instagram-new.png" alt="Instagram"/></a>
      <a href="https://twitter.com"><img src="https://img.icons8.com/fluent/30/000000/twitter.png" alt="Twitter"/></a>
    </div>
    <p className="text-center text-gray-700 font-medium">
      &copy; 2025 Company Ltd. All rights reserved.
    </p>
  </div>
</footer>
  );
}

function useRechercheFilms(
  filtres: Readonly<FiltresRechercheFilms>): {
    resultats: DetailsFilm[];
    loading: boolean;
    error: string | null;
  } {
  const [resultats, setResultats] = useState<DetailsFilm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasCriteria =
      filtres.titre.trim().length >= 3 ||
      filtres.genre !== "" ||
      filtres.annee !== "";

    if (!hasCriteria) {
      setResultats([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filtres.titre.trim().length >= 3) {
          params.append("titre", filtres.titre.trim());
        }
        if (filtres.genre) params.append("genre", filtres.genre);
        if (filtres.annee) params.append("annee", filtres.annee);

        const response = await fetch(
          `${API_URL}/tmdb/recherche/avancee?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch films');
        }
        const data: DetailsFilm[] = await response.json();
        setResultats(data);
      } catch {
        setError("Erreur lors de la recherche");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [filtres.titre, filtres.genre, filtres.annee]);

  return { resultats, loading, error };
}

function BarreRecherche() {
  const router = useRouter();
  const [titre, setTitre] = useState<string>("");
  const [genre, setGenre] = useState<string>("");
  const [annee, setAnnee] = useState<string>("");
  const [showResults, setShowResults] = useState<boolean>(false);

  const { resultats, loading, error } = useRechercheFilms({
    titre,
    genre,
    annee,
  });

  const afficherResultats =
    showResults &&
    (titre.trim().length >= 3 || genre !== "" || annee !== "");

  return (
    <div className="relative w-full max-w-lg mx-auto space-y-2">
      {/* TITRE */}
      <input
        type="search"
        placeholder="Titre du film (min. 3 caractères)"
        value={titre}
        onChange={(e) => {
          setTitre(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        className="
          relative z-10 w-full rounded-md border border-gray-300 bg-white
          py-2 px-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
        "
      />
      {/* FILTRES */}
      <div className="flex gap-2">
        {/* GENRE */}
        <select
          value={genre}
          onChange={(e) => {
            setGenre(e.target.value);
            setShowResults(true);
          }}
          className="w-1/2 rounded-md border border-gray-300 bg-white py-2 px-2"
        >
          <option value="">Tous les genres</option>
          <option value="Action">Action</option>
          <option value="Comédie">Comédie</option>
          <option value="Drame">Drame</option>
          <option value="Thriller">Thriller</option>
          <option value="Animation">Animation</option>
          <option value="Science-Fiction">Science-Fiction</option>
        </select>
        {/* ANNÉE */}
        <input
          type="number"
          placeholder="Année"
          value={annee}
          onChange={(e) => {
            setAnnee(e.target.value);
            setShowResults(true);
          }}
          className="w-1/2 rounded-md border border-gray-300 bg-white py-2 px-3"
        />
      </div>
      {/* RÉSULTATS */}
      {afficherResultats && (
        <div
          className="
            absolute top-full left-0 mt-1 z-50 w-full
            bg-white border border-gray-300 rounded-md shadow-lg
            max-h-96 overflow-y-auto
          "
        >
          {loading && (
            <div className="p-4 text-center text-gray-500">
              Recherche en cours...
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
                <li key={film.id} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => router.push(`/films/${film.id}`)}
                    className="
                      w-full p-3 flex gap-3 items-center cursor-pointer text-left
                      hover:bg-gray-100
                    "
                  >
                    {film.affiche_url ? (
                      <img
                        src={film.affiche_url}
                        alt={film.titre}
                        className="w-10 h-14 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-gray-200 rounded flex items-center justify-center text-xs">
                        N/A
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{film.titre}</p>
                      <p className="text-xs text-gray-500">
                        {film.date_sortie
                          ? new Date(film.date_sortie).getFullYear()
                          : "N/A"}{" "}
                        • ⭐ {film.note_moyenne.toFixed(1)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function useRechercheFilms2(requete: string) {
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
          `${API_URL}/tmdb/recherche?query=${encodeURIComponent(requete)}`
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

function CarteFilms({ id, titre, resume, date_sortie, affiche_url, note_moyenne }: Readonly<DetailsFilm>) {
  const router = useRouter();
  return (
    <article className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition">
      <button
        type="button"
        onClick={() => router.push(`/films/${id}`)}
        className="cursor-pointer p-4 w-full text-left"
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
      </button>
    </article>
  );
}

export { Header, Footer, BarreRecherche, useRechercheFilms2 as RechercheFilms, CarteFilms };