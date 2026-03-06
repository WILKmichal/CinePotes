"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Liste {
  id: string;
  nom: string;
  films: number[];
}

interface FilmInfo {
  id: number;
  titre: string;
  affiche_url: string | null;
  date_sortie: string | null;
  note_moyenne: number | null;
}

export default function MesListesPage() {
  const router = useRouter();
  const [listes, setListes] = useState<Liste[]>([]);
  const [filmsCache, setFilmsCache] = useState<Record<number, FilmInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("access_token");
    }
    return null;
  };

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

  useEffect(() => {
    const token = getToken();
    const isGuest = sessionStorage.getItem("is_guest") === "true";
    
    if (!token) {
      router.push("/");
      return;
    }

    if (isGuest) {
      router.push("/");
      return;
    }

    fetchListes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchFilmInfo = async (tmdbId: number) => {
    try {
      const res = await fetch(`${API_URL}/library/${tmdbId}`);
      if (res.ok) {
        const data = await res.json();
        setFilmsCache((prev) => ({
          ...prev,
          [tmdbId]: {
            id: data.id,
            titre: data.titre,
            affiche_url: data.affiche_url,
            date_sortie: data.date_sortie,
            note_moyenne: data.note_moyenne,
          },
        }));
      }
    } catch {
      console.error(`Erreur chargement film ${tmdbId}`);
    }
  };

  const handleDeleteFilm = (listId: string, tmdbId: number) => {
    const filmName = filmsCache[tmdbId]?.titre || `Film #${tmdbId}`;
    setConfirmModal({
      message: `Supprimer "${filmName}" de cette liste ?`,
      onConfirm: async () => {
        const token = getToken();
        if (!token) return;
        try {
          const res = await fetch(`${API_URL}/lists/${listId}/films/${tmdbId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setListes((prev) =>
              prev.map((liste) =>
                liste.id === listId
                  ? { ...liste, films: liste.films.filter((id) => id !== tmdbId) }
                  : liste
              )
            );
          }
        } catch {
          console.error("Erreur suppression film");
        }
        setConfirmModal(null);
      },
    });
  };

  const handleDeleteList = (listId: string, listName: string) => {
    setConfirmModal({
      message: `Supprimer la liste "${listName}" ?`,
      onConfirm: async () => {
        const token = getToken();
        if (!token) return;
        try {
          const res = await fetch(`${API_URL}/lists/${listId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setListes((prev) => prev.filter((liste) => liste.id !== listId));
          }
        } catch {
          console.error("Erreur suppression liste");
        }
        setConfirmModal(null);
      },
    });
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = (liste: Liste) => {
    setEditingListId(liste.id);
    setEditingName(liste.nom);
  };

  const [editError, setEditError] = useState<string | null>(null);

  const handleSaveEdit = async (listId: string, originalName: string) => {
    const token = getToken();
    if (!token) return;
    const newName = editingName.trim();

    if (!newName || newName === originalName) {
      setEditingListId(null);
      setEditingName("");
      setEditError(null);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/lists/${listId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nom: newName }),
      });

      if (res.ok) {
        setListes((prev) =>
          prev.map((liste) =>
            liste.id === listId ? { ...liste, nom: newName } : liste
          )
        );
        setEditingListId(null);
        setEditingName("");
        setEditError(null);
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = Array.isArray(data?.message)
          ? data.message[0]
          : (data?.message ?? "Nom invalide");
        setEditError(msg);
      }
    } catch {
      setEditError("Impossible de mettre à jour la liste");
    }
  };

  // Focus l'input quand on commence l'édition
  useEffect(() => {
    if (editingListId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingListId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Chargement de vos listes...</p>
          </div>
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
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
            <p className="text-red-500 mb-4 text-lg">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
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
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Mes Listes</h1>

          {listes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <p className="text-gray-600 text-lg">Vous n&apos;avez pas encore de liste.</p>
              <p className="text-gray-500 mt-2">Ajoutez des films depuis leur page de détails !</p>
            </div>
          ) : (
            <div className="space-y-8">
              {listes.map((liste) => (
                <div
                  key={liste.id}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
                >
                  {/* Header de la liste */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      {editingListId === liste.id ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <input
                              ref={inputRef}
                              type="text"
                              value={editingName}
                              onChange={(e) => { setEditingName(e.target.value.slice(0, 25)); setEditError(null); }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(liste.id, liste.nom);
                                if (e.key === "Escape") { setEditingListId(null); setEditingName(""); setEditError(null); }
                              }}
                              maxLength={25}
                              className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none px-1 py-0"
                            />
                            <span className={`text-xs ${editingName.length >= 25 ? "text-red-500" : "text-gray-400"}`}>
                              {editingName.length}/25
                            </span>
                            <button
                              onClick={() => handleSaveEdit(liste.id, liste.nom)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Valider"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => { setEditingListId(null); setEditingName(""); setEditError(null); }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Annuler"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          {editError && (
                            <p className="text-xs text-red-500 pl-1">{editError}</p>
                          )}
                        </div>
                      ) : (
                        <>
                          <h2 className="text-2xl font-bold text-gray-900">{liste.nom}</h2>
                          <button
                            onClick={() => handleStartEdit(liste)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Modifier le nom"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteList(liste.id, liste.nom)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Supprimer la liste"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Grille des films */}
                  {liste.films.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                      <p className="text-gray-400 italic">Liste vide</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {liste.films.map((tmdbId) => {
                        const film = filmsCache[tmdbId];
                        return (
                          <div
                            key={tmdbId}
                            className="group relative bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                          >
                            {/* Affiche du film */}
                            <button
                              onClick={() => router.push(`/films/${tmdbId}`)}
                              className="w-full aspect-[2/3] relative"
                            >
                              {film?.affiche_url ? (
                                <img
                                  src={film.affiche_url}
                                  alt={film.titre}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                  <svg
                                    className="w-12 h-12 text-gray-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                                    />
                                  </svg>
                                </div>
                              )}

                              {/* Overlay avec infos au hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                <p className="text-white font-semibold text-sm line-clamp-2">
                                  {film?.titre || `Film #${tmdbId}`}
                                </p>
                                {film?.date_sortie && (
                                  <p className="text-gray-300 text-xs mt-1">
                                    {new Date(film.date_sortie).getFullYear()}
                                  </p>
                                )}
                                {film?.note_moyenne && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-yellow-500 text-xs font-medium">
                                      {film.note_moyenne.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </button>

                            {/* Bouton supprimer */}
                            <button
                              onClick={() => handleDeleteFilm(liste.id, tmdbId)}
                              className="absolute top-2 right-2 p-1.5 bg-black/70 text-gray-300 hover:text-red-400 hover:bg-black/90 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                              title="Retirer de la liste"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modal de confirmation */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-md">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm mx-4 animate-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium">{confirmModal.message}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


