"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Header, Footer } from "@/components/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

interface Film {
  id: number;
  titre: string;
  affiche_url: string | null;
  date_sortie: string;
  note_moyenne: number;
}

interface FilmClasse extends Film {
  rang_moyen: number;
}

interface Proposition {
  tmdb_id: number;
}

const getToken = () => {
  if (globalThis.window === undefined) return null;
  return sessionStorage.getItem("access_token");
};


function rankIcon(i: number): string {
  if (i === 0) return "🥇";
  if (i === 1) return "🥈";
  if (i === 2) return "🥉";
  return `${i + 1}`;
}

function rankClass(i: number): string {
  if (i === 0) return "bg-yellow-50 border-2 border-yellow-300";
  if (i === 1) return "bg-gray-100 border border-gray-200";
  if (i === 2) return "bg-orange-50 border border-orange-200";
  return "bg-gray-50 border border-gray-100";
}

function ClassementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const seanceId = searchParams.get("seanceId") ?? "";

  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [waitingOthers, setWaitingOthers] = useState(false);
  const [resultat, setResultat] = useState<FilmClasse[] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isMaster, setIsMaster] = useState(false);
  const [isPartialResults, setIsPartialResults] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Early auth check on mount - redirect before rendering content
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
      router.replace("/");
    }
  }, [router]);

  // Check if current user is session master
  useEffect(() => {
    const proprietaireId = sessionStorage.getItem("seance_proprietaire_id");
    if (proprietaireId) {
      const token = getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const currentUserId = payload.sub;
          setIsMaster(currentUserId === proprietaireId);
        } catch {
          setIsMaster(false);
        }
      }
    }
  }, []);

  // Polling : si la séance disparaît (hôte l'a supprimée), rediriger vers /lobby
  useEffect(() => {
    if (!seanceId || resultat) return;
    const token = getToken();
    const interval = setInterval(async () => {
      const res = await fetch(`${API_URL}/seances/${seanceId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        clearInterval(interval);
        sessionStorage.removeItem("classement_seance_id");
        sessionStorage.removeItem("seance_proprietaire_id");
        localStorage.removeItem("joined_seance");
        router.push("/lobby");
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [seanceId, resultat, router]);

  // Charger les films ET vérifier si le résultat final est déjà disponible
  useEffect(() => {
    if (!seanceId) return;
    const token = getToken();

    const load = async () => {
      try {
        // 0. Vérifier que la séance existe encore ET déterminer si on est l'hôte
        const participantsRes = await fetch(
          `${API_URL}/seances/${seanceId}/participants`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!participantsRes.ok) {
          // Séance introuvable → nettoyer et retourner au lobby
          sessionStorage.removeItem("classement_seance_id");
          localStorage.removeItem("joined_seance");
          router.push("/lobby");
          return;
        }

        // 1. Vérifier si tous ont déjà voté → afficher directement le résultat
        const statusRes = await fetch(
          `${API_URL}/seances/${seanceId}/classement/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (statusRes.ok) {
          const allDone: boolean = await statusRes.json();
          if (allDone) {
            const resultatRes = await fetch(
              `${API_URL}/seances/${seanceId}/classement/resultat`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (resultatRes.ok) {
              const scores: { tmdb_id: number; rang_moyen: number }[] = await resultatRes.json();
              // Récupérer les infos films
              const ids = scores.map((s) => s.tmdb_id);
              const filmsRes = await fetch(
                `${API_URL}/library/movies?ids=${ids.join(",")}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (filmsRes.ok) {
                const filmData: Film[] = await filmsRes.json();
                const filmMap = new Map(filmData.map((f) => [f.id, f]));
                const final = scores
                  .map((s) => {
                    const film = filmMap.get(s.tmdb_id);
                    if (!film) return null;
                    return { ...film, rang_moyen: s.rang_moyen };
                  })
                  .filter((f): f is FilmClasse => f !== null);
                setResultat(final);
                sessionStorage.setItem("classement_seance_id", seanceId);
                setLoading(false);
                return;
              }
            }
          }
        }

        // 2. Sinon charger les films pour le drag & drop
        const propositionsRes = await fetch(
          `${API_URL}/seances/${seanceId}/propositions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!propositionsRes.ok) { setLoading(false); return; }
        const propositions: Proposition[] = await propositionsRes.json();
        const uniqueIds = [...new Set(propositions.map((p) => p.tmdb_id))];
        if (uniqueIds.length === 0) { setLoading(false); return; }

        const filmsRes = await fetch(
          `${API_URL}/library/movies?ids=${uniqueIds.join(",")}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (filmsRes.ok) setFilms(await filmsRes.json());
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    load();
  }, [seanceId, router]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(films);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setFilms(reordered);
  };

  // Soumettre le classement puis poller le résultat
  const handleValidate = async () => {
    const token = getToken();
    const classement = films.map((f, i) => ({ tmdb_id: f.id, rang: i + 1 }));

    const res = await fetch(`${API_URL}/seances/${seanceId}/classement`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ classement }),
    });
    if (!res.ok) return;

    setSubmitted(true);
    setWaitingOthers(true);

    pollIntervalRef.current = setInterval(async () => {
      const statusRes = await fetch(
        `${API_URL}/seances/${seanceId}/classement/status`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!statusRes.ok) return;
      const allDone: boolean = await statusRes.json();
      if (!allDone) return;

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      const resultatRes = await fetch(
        `${API_URL}/seances/${seanceId}/classement/resultat`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!resultatRes.ok) return;

      const scores: { tmdb_id: number; rang_moyen: number }[] = await resultatRes.json();
      const filmMap = new Map(films.map((f) => [f.id, f]));
      const final: FilmClasse[] = scores
        .map((s) => {
          const film = filmMap.get(s.tmdb_id);
          if (!film) return null;
          return { ...film, rang_moyen: s.rang_moyen };
        })
        .filter((f): f is FilmClasse => f !== null);

      setResultat(final);
      setWaitingOthers(false);
      setIsPartialResults(false);
      // Mémoriser qu'on a un résultat actif → pour que /lobby redirige ici
      sessionStorage.setItem("classement_seance_id", seanceId);
    }, 3000);
  };

  // Force show results early (master only)
  const handleForceShowResults = async () => {
    const token = getToken();
    
    const resultatRes = await fetch(
      `${API_URL}/seances/${seanceId}/classement/resultat`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!resultatRes.ok) return;

    const scores: { tmdb_id: number; rang_moyen: number }[] = await resultatRes.json();
    const filmMap = new Map(films.map((f) => [f.id, f]));
    const final: FilmClasse[] = scores
      .map((s) => {
        const film = filmMap.get(s.tmdb_id);
        if (!film) return null;
        return { ...film, rang_moyen: s.rang_moyen };
      })
      .filter((f): f is FilmClasse => f !== null);

    setResultat(final);
    setWaitingOthers(false);
    setIsPartialResults(true);
    sessionStorage.setItem("classement_seance_id", seanceId);
    
    // Keep polling to update results when others submit
    // Don't clear the interval - let it continue checking for completion
  };

  const handleQuit = async () => {
    const token = getToken();
    // Le backend détecte automatiquement : hôte → supprime la séance, participant → quitte
    await fetch(`${API_URL}/seances/${seanceId}/leave`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.removeItem("joined_seance");
    sessionStorage.removeItem("classement_seance_id");
    sessionStorage.removeItem("seance_proprietaire_id");
    router.push("/lobby");
  };

  function renderContent() {
    if (resultat) {
      return (
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {isPartialResults && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-center">
              <p className="text-amber-800 font-semibold text-sm">
                ⚠️ Résultats Partiels - Tous les participants n'ont pas encore classé leurs films
              </p>
              <p className="text-amber-600 text-xs mt-1">
                Les résultats seront mis à jour automatiquement au fur et à mesure des soumissions
              </p>
            </div>
          )}
          <div className="text-center space-y-2">
            <div className="text-5xl">🏆</div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
              Résultat du groupe !
            </h2>
            <p className="text-gray-400 text-sm">Classement calculé par moyenne des votes de tous</p>
          </div>
          <ol className="space-y-3">
            {resultat.map((film, i) => (
              <li key={film.id} className={`flex items-center gap-4 p-4 rounded-xl ${rankClass(i)}`}>
                <span className="text-xl w-8 text-center font-black">{rankIcon(i)}</span>
                <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                  {film.affiche_url ? (
                    <img src={`${TMDB_IMG}${film.affiche_url}`} alt={film.titre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">🎬</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{film.titre}</p>
                  <p className="text-xs text-gray-400">{film.date_sortie?.slice(0, 4)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">rang moyen</p>
                  <p className="font-black text-[#C84B31] text-lg">{film.rang_moyen.toFixed(1)}</p>
                </div>
              </li>
            ))}
          </ol>
          <button
            onClick={handleQuit}
            className="w-full bg-[#C84B31] text-white py-3 rounded-xl font-semibold hover:bg-[#b03a24] transition-colors"
          >
            🚪 Quitter la session
          </button>
        </div>
      );
    }

    if (waitingOthers) {
      return (
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center space-y-4">
          <div className="text-5xl">⏳</div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">Vote envoyé !</h2>
          <p className="text-gray-500 text-sm">En attente des autres participants...</p>
          <div className="flex justify-center pt-2">
            <div className="w-8 h-8 border-4 border-[#C84B31] border-t-transparent rounded-full animate-spin" />
          </div>
          {isMaster && (
            <div className="pt-6 border-t border-gray-100">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-widest mb-3">
                ⚡ Maître de Session
              </p>
              <button
                onClick={handleForceShowResults}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
              >
                ⚡ Afficher les résultats maintenant
              </button>
              <p className="text-xs text-gray-400 mt-2">
                Voir les résultats avec les soumissions actuelles uniquement
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
              <span className="text-[#C84B31]">Classez</span> vos films
            </h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">
              Glissez du préféré au moins préféré · les votes seront moyennés
            </p>
          </div>
          <button
            onClick={handleValidate}
            disabled={submitted || films.length === 0}
            className="flex items-center gap-2 bg-[#C84B31] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#b03a24] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✓ Valider
          </button>
        </div>
        {films.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
            <div className="text-4xl mb-3">🎬</div>
            <p>Aucune proposition trouvée.</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="classement">
              {(provided) => (
                <ol ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                  {films.map((film, i) => (
                    <Draggable key={String(film.id)} draggableId={String(film.id)} index={i}>
                      {(provided, snapshot) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center gap-4 p-4 rounded-2xl border bg-white transition-shadow cursor-grab active:cursor-grabbing select-none ${
                            snapshot.isDragging
                              ? "shadow-2xl border-[#C84B31] rotate-1 scale-[1.02]"
                              : "shadow border-gray-100 hover:shadow-md"
                          }`}
                        >
                          <span className="text-xl font-black w-8 text-center text-gray-300">{rankIcon(i)}</span>
                          <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                            {film.affiche_url ? (
                              <img src={`${TMDB_IMG}${film.affiche_url}`} alt={film.titre} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">🎬</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{film.titre}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {film.date_sortie?.slice(0, 4)} · ⭐ {film.note_moyenne?.toFixed(1)}
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ol>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C84B31] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Prevent rendering if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow px-4 py-8 mt-16 max-w-3xl mx-auto w-full">

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8">
          {["Configuration", "Équipe", "Sélection"].map((step) => (
            <div key={step} className="contents">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="uppercase text-xs tracking-widest">{step}</span>
              </div>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          ))}
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1B3A5C]">
            <div className="w-6 h-6 rounded-full bg-[#C84B31] text-white flex items-center justify-center text-xs font-bold">4</div>
            <span className="uppercase text-xs tracking-widest">Classement</span>
          </div>
        </div>

        {renderContent()}
      </main>

      <Footer />
    </div>
  );
}

export default function ClassementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C84B31] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ClassementContent />
    </Suspense>
  );
}

