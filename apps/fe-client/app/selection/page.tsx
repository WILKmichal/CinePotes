"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header, Footer } from "@/components/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

interface Film {
  id: number;
  titre: string;
  resume: string;
  date_sortie: string;
  affiche_url: string | null;
  note_moyenne: number;
}

interface ListWithFilms {
  id: string;
  nom: string;
  description?: string;
  films: number[];
}

const getToken = () =>
  globalThis.window !== undefined ? sessionStorage.getItem("access_token") : null;

// ─── Composant principal (avec Suspense boundary pour useSearchParams) ─────────

function SelectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const seanceId = searchParams.get("seanceId") ?? "";

  const [maxFilms, setMaxFilms] = useState(3);
  const [selected, setSelected] = useState<(Film | null)[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Film[]>([]);
  const [searching, setSearching] = useState(false);
  const [validated, setValidated] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [slotIndex, setSlotIndex] = useState<number | null>(null);
  const [lists, setLists] = useState<ListWithFilms[]>([]);
  const [showListImport, setShowListImport] = useState(false);
  const [importingList, setImportingList] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isMaster, setIsMaster] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Early auth check on mount - redirect before rendering content
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
      router.replace("/");
    }
  }, [router]);

  // Récupérer max_films depuis la séance
  useEffect(() => {
    if (!seanceId) return;
    const token = getToken();
    fetch(`${API_URL}/seances/self`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: { max_films?: number; proprietaire_id?: string } | null) => {
        if (data?.max_films) {
          setMaxFilms(data.max_films);
          setSelected(new Array(data.max_films).fill(null));
        }
        // Stocker pour que /classement sache si on est l'hôte
        if (data?.proprietaire_id) {
          sessionStorage.setItem("seance_proprietaire_id", data.proprietaire_id);
          // Check if current user is the session master
          const token = getToken();
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split(".")[1]));
              const currentUserId = payload.sub;
              setIsMaster(currentUserId === data.proprietaire_id);
            } catch {
              setIsMaster(false);
            }
          }
        }
      })
      .catch(() => {
        setSelected(new Array(3).fill(null));
      });
  }, [seanceId]);

  // Récupérer les listes de l'utilisateur
  useEffect(() => {
    const token = getToken();
    fetch(`${API_URL}/lists/with-films`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: ListWithFilms[]) => {
        setLists(data);
      })
      .catch(() => {
        // Échec silencieux, les listes ne seront pas disponibles
      });
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `${API_URL}/library/recherche?query=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (res.ok) setResults(await res.json());
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => handleSearch(search), 400);
    return () => clearTimeout(t);
  }, [search, handleSearch]);

  const openSearch = (index: number) => {
    setSlotIndex(index);
    setShowSearch(true);
    setSearch("");
    setResults([]);
  };

  const pickFilm = (film: Film) => {
    if (slotIndex === null) return;
    setSelected((prev) => {
      const next = [...prev];
      next[slotIndex] = film;
      return next;
    });
    setShowSearch(false);
    setSlotIndex(null);
  };

  const removeFilm = (index: number) => {
    setSelected((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const importFromList = async (list: ListWithFilms) => {
    if (importingList) return;
    setImportingList(true);

    try {
      // Calculer les slots vides disponibles
      const emptySlots = selected.reduce<number[]>((acc, film, idx) => {
        if (!film) acc.push(idx);
        return acc;
      }, []);

      if (emptySlots.length === 0) {
        // Tous les slots sont pleins
        setImportingList(false);
        return;
      }

      // Filtrer les films de la liste qui ne sont pas déjà sélectionnés
      const selectedTmdbIds = new Set(
        selected.filter(Boolean).map((f) => f!.id)
      );
      const filmsToImport = list.films.filter(
        (tmdbId) => !selectedTmdbIds.has(tmdbId)
      );

      // Prendre seulement le nombre de films nécessaires pour remplir les slots vides
      const filmIdsToFetch = filmsToImport.slice(0, emptySlots.length);

      if (filmIdsToFetch.length === 0) {
        // Aucun nouveau film à importer
        setImportingList(false);
        return;
      }

      // Récupérer les détails des films depuis l'API library
      const res = await fetch(
        `${API_URL}/library/movies?ids=${filmIdsToFetch.join(",")}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      if (res.ok) {
        const films: Film[] = await res.json();
        
        // Remplir les slots vides avec les films importés
        setSelected((prev) => {
          const next = [...prev];
          films.forEach((film, idx) => {
            if (idx < emptySlots.length) {
              next[emptySlots[idx]] = film;
            }
          });
          return next;
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
    } finally {
      setImportingList(false);
      setShowListImport(false);
    }
  };

  const filledCount = selected.filter(Boolean).length;
  const allFilled = filledCount === maxFilms;

  // Polling : détecter si la séance a disparu (hôte parti) → retourner au lobby
  useEffect(() => {
    if (!seanceId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`${API_URL}/seances/${seanceId}/participants`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        clearInterval(interval);
        localStorage.removeItem("joined_seance");
        sessionStorage.removeItem("classement_seance_id");
        sessionStorage.removeItem("seance_proprietaire_id");
        router.push("/lobby");
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [seanceId, router]);

  const handleValidate = async () => {
    const token = getToken();
    const tmdbIds = (selected.filter(Boolean) as Film[]).map((f) => f.id);
    try {
      const res = await fetch(`${API_URL}/seances/${seanceId}/propositions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tmdbIds }),
      });
      if (!res.ok) return;
      setValidated(true);
      // Poll until all participants have submitted → redirect to /classement
      pollIntervalRef.current = setInterval(async () => {
        const statusRes = await fetch(
          `${API_URL}/seances/${seanceId}/propositions/status`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        if (!statusRes.ok) {
          // Séance supprimée → retourner au lobby
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          localStorage.removeItem("joined_seance");
          sessionStorage.removeItem("classement_seance_id");
          sessionStorage.removeItem("seance_proprietaire_id");
          router.push("/lobby");
          return;
        }
        const allDone: boolean = await statusRes.json();
        if (allDone) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          router.push(`/classement?seanceId=${seanceId}`);
        }
      }, 3000);
    } catch {
      // silent
    }
  };

  // Prevent rendering if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow px-4 py-8 mt-16 max-w-5xl mx-auto w-full">

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="uppercase text-xs tracking-widest">Configuration</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="uppercase text-xs tracking-widest">Équipe</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1B3A5C]">
            <div className="w-6 h-6 rounded-full bg-[#C84B31] text-white flex items-center justify-center text-xs font-bold">3</div>
            <span className="uppercase text-xs tracking-widest">Sélection Films</span>
          </div>
        </div>

        {validated ? (
          /* ── État : propositions envoyées ── */
          <div className="bg-white rounded-2xl shadow-xl p-10 text-center space-y-4">
            <div className="text-5xl">🎬</div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
              Propositions envoyées !
            </h2>
            <p className="text-gray-500 text-sm">
              En attente des autres participants...
            </p>
            <div className="flex justify-center gap-3 pt-4">
              {(selected.filter(Boolean) as Film[]).map((f) => (
                <img
                  key={f.id}
                  src={f.affiche_url ? `${TMDB_IMG}${f.affiche_url}` : "/placeholder-film.png"}
                  alt={f.titre}
                  className="w-16 rounded-xl shadow"
                />
              ))}
            </div>
            {isMaster && (
              <div className="pt-6 border-t border-gray-100">
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-widest mb-3">
                  ⚡ Maître de Session
                </p>
                <button
                  onClick={() => {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    router.push(`/classement?seanceId=${seanceId}`);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
                >
                  ⚡ Forcer l'étape suivante - Aller au classement
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  Passer l'attente et continuer avec les films soumis uniquement
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── En-tête ── */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="text-[#C84B31]">Vos propositions</span>
                </h1>
                <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">
                  Sélection en cours · {filledCount}/{maxFilms} prêts
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Bouton Import depuis liste */}
                {lists.length > 0 && filledCount < maxFilms && (
                  <button
                    onClick={() => setShowListImport(true)}
                    className="flex items-center gap-2 bg-white text-[#1B3A5C] border-2 border-[#1B3A5C] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1B3A5C] hover:text-white transition-colors"
                  >
                    📋 Importer depuis une liste
                  </button>
                )}

                {/* Mini aperçu des slots */}
                <div className="flex gap-1">
                  {selected.map((f, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                        f ? "border-[#C84B31] bg-[#C84B31] text-white" : "border-gray-300 text-gray-400"
                      }`}
                    >
                      {f ? "✓" : "?"}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleValidate}
                  disabled={!allFilled}
                  className="flex items-center gap-2 bg-[#1B3A5C] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#14305a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ✓ Valider mes choix
                </button>
              </div>
            </div>

            {/* ── Grille des slots ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
              {selected.map((film, i) => (
                <div key={i}>
                  {film ? (
                    /* Slot rempli */
                    <div className="relative group rounded-2xl overflow-hidden shadow-md aspect-[2/3] bg-gray-200">
                      <img
                        src={film.affiche_url ? `${TMDB_IMG}${film.affiche_url}` : "/placeholder-film.png"}
                        alt={film.titre}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                        <p className="text-white text-xs font-bold text-center leading-tight">{film.titre}</p>
                        <button
                          onClick={() => openSearch(i)}
                          className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg transition-colors"
                        >
                          Changer
                        </button>
                        <button
                          onClick={() => removeFilm(i)}
                          className="text-xs text-red-300 hover:text-red-200 transition-colors"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Slot vide */
                    <button
                      onClick={() => openSearch(i)}
                      className="w-full aspect-[2/3] border-2 border-dashed border-gray-300 hover:border-[#C84B31] rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#C84B31] transition-colors group"
                    >
                      <span className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-red-50 flex items-center justify-center text-xl transition-colors">+</span>
                      <span className="text-xs font-semibold uppercase tracking-widest">Choisir</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Modal recherche ── */}
        {showSearch && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-gray-900 uppercase tracking-wide text-sm">
                    Choisir un film
                  </h3>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                  >
                    ✕
                  </button>
                </div>
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un film..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A5C] transition-colors"
                />
              </div>

              <div className="overflow-y-auto flex-1">
                {searching && (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-[#C84B31] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!searching && results.length === 0 && search.length >= 2 && (
                  <p className="text-center text-gray-400 text-sm py-8">Aucun résultat</p>
                )}
                {!searching && search.length < 2 && (
                  <p className="text-center text-gray-400 text-sm py-8">Tapez au moins 2 caractères...</p>
                )}
                {results.map((film) => (
                  <button
                    key={film.id}
                    onClick={() => pickFilm(film)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left"
                  >
                    <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      {film.affiche_url ? (
                        <img
                          src={`${TMDB_IMG}${film.affiche_url}`}
                          alt={film.titre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">🎬</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{film.titre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {film.date_sortie?.slice(0, 4)} · ⭐ {film.note_moyenne.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{film.resume}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Modal import depuis liste ── */}
        {showListImport && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-gray-900 uppercase tracking-wide text-sm">
                    Importer depuis une liste
                  </h3>
                  <button
                    onClick={() => setShowListImport(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {filledCount < maxFilms 
                    ? `${maxFilms - filledCount} slot${maxFilms - filledCount > 1 ? 's' : ''} disponible${maxFilms - filledCount > 1 ? 's' : ''}`
                    : "Tous les slots sont remplis"}
                </p>
              </div>

              <div className="overflow-y-auto flex-1">
                {importingList && (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-[#C84B31] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!importingList && lists.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">Aucune liste disponible</p>
                )}
                {!importingList && lists.map((list) => {
                  const availableFilms = list.films.filter(
                    (tmdbId) => !selected.some((f) => f?.id === tmdbId)
                  );
                  const willImport = Math.min(availableFilms.length, maxFilms - filledCount);

                  return (
                    <button
                      key={list.id}
                      onClick={() => importFromList(list)}
                      disabled={willImport === 0}
                      className="w-full flex flex-col gap-2 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{list.nom}</p>
                          {list.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{list.description}</p>
                          )}
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-[#C84B31] text-white">
                            {list.films.length} film{list.films.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {willImport > 0 ? (
                          <>
                            <span className="text-green-600 font-semibold">
                              ✓ Importera {willImport} film{willImport > 1 ? 's' : ''}
                            </span>
                            {availableFilms.length > willImport && (
                              <span className="text-gray-400">
                                ({availableFilms.length - willImport} ignoré{availableFilms.length - willImport > 1 ? 's' : ''})
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">
                            Aucun nouveau film disponible
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C84B31] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SelectionContent />
    </Suspense>
  );
}

