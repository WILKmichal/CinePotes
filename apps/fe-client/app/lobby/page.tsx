"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Seance {
  id: string;
  nom: string;
  code: string;
  statut: "en_attente" | "en_cours" | "terminee" | "annulee";
  max_films: number;
  proprietaire_id: string;
}

interface Participant {
  id: string;
  utilisateur_id: string;
  seance_id: string;
  a_rejoint_le: string;
  utilisateur?: { id: string; nom: string };
}

type AllSessionsResponse = {
  owned: Seance | null;
  participated: Seance[];
};

const getToken = () =>
  globalThis.window !== undefined ? sessionStorage.getItem("access_token") : null;

const getUserId = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub as string;
  } catch {
    return null;
  }
};

const AVATAR_COLORS = [
  "bg-orange-400", "bg-yellow-400", "bg-teal-600",
  "bg-blue-500", "bg-purple-500", "bg-pink-500",
];

// ─── Page sans session : Créer ou Rejoindre ───────────────────────────────────

function NoSessionPage({ onEntered }: Readonly<{ onEntered: () => void }>) {
  const router = useRouter();
  const [tab, setTab] = useState<"join" | "create">("join");
  const isLoggedIn = getToken() !== null;
  const isGuest = globalThis.window !== undefined ? sessionStorage.getItem("is_guest") === "true" : false;

  // Rejoindre
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null); // Code validated, waiting for name
  const [guestName, setGuestName] = useState("");
  const [submittingName, setSubmittingName] = useState(false);

  // Créer
  const [nom, setNom] = useState("");
  const [maxFilms, setMaxFilms] = useState(3);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) return;
    
    const token = getToken();
    
    // If logged in, proceed directly
    if (token) {
      setJoining(true);
      setJoinError(null);
      try {
        const res = await fetch(`${API_URL}/seances/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ code: code.trim().toUpperCase() }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const seance = (data as { seance?: Seance }).seance;
          if (seance) localStorage.setItem("joined_seance", JSON.stringify(seance));
          onEntered();
        } else if (res.status === 409) {
          const selfRes = await fetch(`${API_URL}/seances/self`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (selfRes.ok) {
            const selfData: Seance | null = await selfRes.json();
            if (selfData) localStorage.setItem("joined_seance", JSON.stringify(selfData));
          }
          onEntered();
        } else {
          const data = await res.json().catch(() => ({}));
          setJoinError((data as { message?: string }).message ?? "Code invalide ou session introuvable");
        }
      } catch {
        setJoinError("Erreur de connexion au serveur");
      } finally {
        setJoining(false);
      }
    } else {
      // Not logged in: validate code first
      setJoining(true);
      setJoinError(null);
      try {
        // Check if code exists by trying to get participants
        const res = await fetch(`${API_URL}/seances/by-code/${code.trim().toUpperCase()}`);
        if (res.ok) {
          // Code is valid, ask for name
          setPendingCode(code.trim().toUpperCase());
          setCode("");
        } else if (res.status === 404) {
          setJoinError("Code invalide ou session introuvable");
        } else {
          setJoinError("Erreur lors de la vérification du code");
        }
      } catch {
        setJoinError("Erreur de connexion au serveur");
      } finally {
        setJoining(false);
      }
    }
  };

  const handleGuestNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim().length < 2 || !pendingCode) return;

    setSubmittingName(true);
    setJoinError(null);
    
    // Check if already a guest with an active session
    const existingSessionId = localStorage.getItem("current_session_id");
    if (existingSessionId && typeof window !== "undefined") {
      const isGuest = sessionStorage.getItem("is_guest") === "true";
      if (isGuest) {
        setJoinError("As a guest, you can only join one lobby at a time. Please leave your current lobby first.");
        setSubmittingName(false);
        return;
      }
    }
    
    try {
      // First, create guest user
      const guestRes = await fetch(`${API_URL}/auth/guest-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: guestName.trim() }),
      });
      if (!guestRes.ok) {
        const data = await guestRes.json().catch(() => ({}));
        setJoinError((data as { message?: string }).message ?? "Erreur lors de la création du compte invité");
        setSubmittingName(false);
        return;
      }

      const guestData = await guestRes.json();
      sessionStorage.setItem("access_token", guestData.access_token);
      sessionStorage.setItem("is_guest", "true");
      sessionStorage.setItem("display_name", guestData.displayName);

      // Then join the session
      const joinRes = await fetch(`${API_URL}/seances/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${guestData.access_token}` },
        body: JSON.stringify({ code: pendingCode }),
      });
      if (joinRes.ok) {
        const data = await joinRes.json().catch(() => ({}));
        const seance = (data as { seance?: Seance }).seance;
        if (seance) localStorage.setItem("joined_seance", JSON.stringify(seance));
        onEntered();
      } else {
        const data = await joinRes.json().catch(() => ({}));
        setJoinError((data as { message?: string }).message ?? "Erreur lors de la connexion à la session");
        setPendingCode(null);
        setGuestName("");
      }
    } catch {
      setJoinError("Erreur de connexion au serveur");
    } finally {
      setSubmittingName(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    const token = getToken();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch(`${API_URL}/seances`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nom: nom.trim(), date: new Date().toISOString(), max_films: maxFilms }),
      });
      if (res.ok) {
        // Le propriétaire peut retrouver sa séance via /seances/self, pas besoin de stocker
        localStorage.removeItem("joined_seance");
        onEntered();
      } else if (res.status === 409) {
        // Une séance est déjà active pour cet utilisateur : recharger l'état courant
        onEntered();
      } else {
        const data = await res.json().catch(() => ({}));
        setCreateError((data as { message?: string }).message ?? "Impossible de créer la session");
      }
    } catch {
      setCreateError("Erreur de connexion au serveur");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-16 mt-16">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#C84B31] to-orange-400" />

          <div className="p-8 space-y-6">
            <div className="text-center space-y-1">
              <div className="text-4xl">🎬</div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
                CinéPotes
              </h1>
              <p className="text-sm text-gray-400">Créez ou rejoignez une session</p>
            </div>

            {/* Onglets - Affichés seulement si connecté (non-guest) */}
            {isLoggedIn && !isGuest && (
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setTab("join")}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    tab === "join"
                      ? "bg-[#1B3A5C] text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Rejoindre
                </button>
                <button
                  onClick={() => setTab("create")}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    tab === "create"
                      ? "bg-[#1B3A5C] text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Créer
                </button>
              </div>
            )}

            {/* Rejoindre */}
            {tab === "join" && (
              <>
                {!pendingCode ? (
                  <form onSubmit={handleJoin} className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor="code-input" className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                        Code de la salle
                      </label>
                      <input
                        id="code-input"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder="ABC123"
                        maxLength={6}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-2xl font-mono font-bold text-center tracking-[0.3em] text-[#1B3A5C] focus:outline-none focus:border-[#1B3A5C] transition-colors"
                      />
                    </div>
                    {joinError && <p className="text-sm text-red-500 text-center">{joinError}</p>}
                    <button
                      type="submit"
                      disabled={joining || code.trim().length !== 6}
                      className="w-full bg-[#1B3A5C] text-white py-3 rounded-xl font-semibold hover:bg-[#14305a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {joining ? "Vérification..." : "Rejoindre →"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleGuestNameSubmit} className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                      Entrez votre nom pour rejoindre la session
                    </p>
                    <div className="space-y-1">
                      <label htmlFor="guest-name-input" className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                        Votre nom
                      </label>
                      <input
                        id="guest-name-input"
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Votre pseudonyme..."
                        maxLength={50}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#1B3A5C] transition-colors"
                        autoFocus
                      />
                    </div>
                    {joinError && <p className="text-sm text-red-500 text-center">{joinError}</p>}
                    <button
                      type="submit"
                      disabled={submittingName || guestName.trim().length < 2}
                      className="w-full bg-[#1B3A5C] text-white py-3 rounded-xl font-semibold hover:bg-[#14305a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingName ? "Connexion..." : "Rejoindre →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingCode(null);
                        setGuestName("");
                        setJoinError(null);
                      }}
                      className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ← Retour
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Créer */}
            {isLoggedIn && tab === "create" && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="nom-input" className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Nom de la session
                  </label>
                  <input
                    id="nom-input"
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Soirée Marvel..."
                    maxLength={50}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#1B3A5C] transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Films par participant
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setMaxFilms(n)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                          maxFilms === n
                            ? "bg-orange-400 border-orange-400 text-white"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                {createError && <p className="text-sm text-red-500 text-center">{createError}</p>}
                <button
                  type="submit"
                  disabled={creating || !nom.trim()}
                  className="w-full bg-[#C84B31] text-white py-3 rounded-xl font-semibold hover:bg-[#a83d27] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Création..." : "Créer la session →"}
                </button>
              </form>
            )}

            <button
              onClick={() => router.push("/")}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─── Page lobby (session active) ──────────────────────────────────────────────

// Session Selector for multiple participated sessions
function SessionSelectorPage({ 
  ownedSession, 
  participatedSessions, 
  onSessionSelected, 
  onCreateNew 
}: Readonly<{ 
  ownedSession: Seance | null;
  participatedSessions: Seance[];
  onSessionSelected: (session: Seance) => void;
  onCreateNew: () => void;
}>) {
  const router = useRouter();

  const handleLeaveSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getToken();
    await fetch(`${API_URL}/seances/${sessionId}/leave`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    // Refresh the page to update the list
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-16 mt-16">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#C84B31] to-orange-400" />

          <div className="p-8 space-y-6">
            <div className="text-center space-y-1">
              <div className="text-4xl">🎬</div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
                Vos sessions
              </h1>
              <p className="text-sm text-gray-400">Sélectionnez une session pour continuer</p>
            </div>

            {/* Owned Session */}
            {ownedSession && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <span>👑</span>
                  <span>Votre session</span>
                </h2>
                <button
                  onClick={() => onSessionSelected(ownedSession)}
                  className="w-full bg-gradient-to-r from-[#1B3A5C] to-[#2a527a] hover:from-[#14305a] hover:to-[#1B3A5C] text-white rounded-xl p-4 transition-all shadow-md hover:shadow-lg text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{ownedSession.nom}</h3>
                      <p className="text-sm opacity-90 mt-1">Code: {ownedSession.code}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                        {ownedSession.statut === "en_cours" ? "EN COURS" : "EN ATTENTE"}
                      </span>
                      <span className="text-xs opacity-75">Cliquez pour ouvrir →</span>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Participated Sessions */}
            {participatedSessions.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <span>👥</span>
                  <span>Sessions rejointes ({participatedSessions.length})</span>
                </h2>
                <div className="space-y-2">
                  {participatedSessions.map((session) => (
                    <div key={session.id} className="relative group">
                      <button
                        onClick={() => onSessionSelected(session)}
                        className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-[#1B3A5C] rounded-xl p-4 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900">{session.nom}</h3>
                            <p className="text-sm text-gray-500 mt-1">Code: {session.code}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                              session.statut === "en_cours" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {session.statut === "en_cours" ? "EN COURS" : "EN ATTENTE"}
                            </span>
                            <span className="text-xs text-gray-400">Cliquez pour ouvrir →</span>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={(e) => handleLeaveSession(session.id, e)}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-lg z-10"
                        title="Quitter cette session"
                      >
                        Quitter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Session Button (only if user doesn't own one) */}
            {!ownedSession && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={onCreateNew}
                  className="w-full bg-[#C84B31] hover:bg-[#b03d24] text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  ➕ Créer une nouvelle session
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function LobbyPage() {
  const router = useRouter();
  const [seance, setSeance] = useState<Seance | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNoSession, setHasNoSession] = useState(false);
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  const [ownedSession, setOwnedSession] = useState<Seance | null>(null);
  const [participatedSessions, setParticipatedSessions] = useState<Seance[]>([]);
  const [copied, setCopied] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Track auth state

  const currentUserId = getUserId();

  const fetchParticipants = useCallback(async (seanceId: string) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/seances/${seanceId}/participants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setParticipants(data);
    }
  }, []);

  const mergeSessions = useCallback((data: AllSessionsResponse) => {
    const allSessions = [...(data.owned ? [data.owned] : []), ...data.participated];
    const uniqueById = new Map<string, Seance>();
    allSessions.forEach((session) => {
      uniqueById.set(session.id, session);
    });
    return Array.from(uniqueById.values());
  }, []);

  // Early auth check on mount - redirect before rendering content
  useEffect(() => {
    const token = getToken();
    const isGuest = globalThis.window !== undefined ? sessionStorage.getItem("is_guest") === "true" : false;

    if (!token && !isGuest) {
      setIsAuthenticated(false);
      router.replace("/");
    }
  }, [router]);

  const loadSeance = useCallback(async (showLoader = false) => {
    const token = getToken();
    if (!token) { router.push("/"); return; }

    // Si on a un résultat de classement actif, vérifier que la séance existe encore avant de rediriger
    const classementSeanceId = sessionStorage.getItem("classement_seance_id");
    if (classementSeanceId) {
      const checkRes = await fetch(`${API_URL}/seances/${classementSeanceId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkRes.ok) {
        router.push(`/classement?seanceId=${classementSeanceId}`);
        return;
      }
      // Séance supprimée → nettoyer et continuer normalement
      sessionStorage.removeItem("classement_seance_id");
      sessionStorage.removeItem("seance_proprietaire_id");
      localStorage.removeItem("joined_seance");
      localStorage.removeItem("current_session_id");
    }

    if (showLoader) setLoading(true);
    try {
      // Fetch all sessions for the user (owned + participated)
      const res = await fetch(`${API_URL}/seances/self/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data: AllSessionsResponse = await res.json();
        setOwnedSession(data.owned);
        setParticipatedSessions(data.participated);

        const availableSessions = mergeSessions(data);

        // Determine which session to show
        // Priority: localStorage selection > first available session
        const currentSessionId = localStorage.getItem("current_session_id");

        if (availableSessions.length > 0) {
          const selectedFromStorage = currentSessionId
            ? availableSessions.find((session) => session.id === currentSessionId)
            : null;

          const activeSession = selectedFromStorage ?? availableSessions[0];

          setHasNoSession(false);
          setShowSessionSelector(false);
          setSeance(activeSession);
          localStorage.setItem("current_session_id", activeSession.id);
          await fetchParticipants(activeSession.id);
          return;
        }
      }

      // No sessions found
      setHasNoSession(true);
      setShowSessionSelector(false);
      localStorage.removeItem("joined_seance");
      localStorage.removeItem("current_session_id");
    } catch {
      setHasNoSession(true);
      setShowSessionSelector(false);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [router, fetchParticipants, mergeSessions]);

  useEffect(() => {
    loadSeance(true);
  }, [loadSeance]);

  // Polling uniquement quand une séance est active (pas sur le formulaire ou le sélecteur)
  useEffect(() => {
    if (hasNoSession || showSessionSelector) return;
    const interval = setInterval(() => loadSeance(false), 5000);
    return () => clearInterval(interval);
  }, [hasNoSession, showSessionSelector, loadSeance]);

  const handleSessionSelected = async (selectedSession: Seance) => {
    localStorage.setItem("current_session_id", selectedSession.id);
    setSeance(selectedSession);
    setShowSessionSelector(false);
    await fetchParticipants(selectedSession.id);
  };

  const handleCreateNewFromSelector = () => {
    setShowSessionSelector(false);
    setHasNoSession(true);
  };

  const handleCopyCode = async () => {
    if (!seance) return;
    await navigator.clipboard.writeText(seance.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunch = async () => {
    if (!seance) return;
    const token = getToken();
    setLaunching(true);
    try {
      await fetch(`${API_URL}/seances/${seance.id}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut: "en_cours" }),
      });
      router.push(`/selection?seanceId=${seance.id}`);
    } finally {
      setLaunching(false);
    }
  };

  const handleGoToSelection = () => {
    if (!seance) return;
    router.push(`/selection?seanceId=${seance.id}`);
  };

  const handleLeave = async () => {
    if (!seance) return;
    const token = getToken();
    const ownerLeaving = seance.proprietaire_id === currentUserId;
    if (ownerLeaving) {
      // L'hôte supprime la séance entière (participants supprimés en cascade)
      await fetch(`${API_URL}/seances/${seance.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      // Le participant quitte simplement
      await fetch(`${API_URL}/seances/${seance.id}/leave`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem("joined_seance");
    localStorage.removeItem("current_session_id");
    setSeance(null);
    // Reload to check if user has other sessions
    await loadSeance(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#C84B31] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500">Chargement...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (showSessionSelector) {
    return (
      <SessionSelectorPage
        ownedSession={ownedSession}
        participatedSessions={participatedSessions}
        onSessionSelected={handleSessionSelected}
        onCreateNew={handleCreateNewFromSelector}
      />
    );
  }

  if (hasNoSession || !seance) {
    return <NoSessionPage onEntered={() => loadSeance(true)} />;
  }

  const isOwner = seance.proprietaire_id === currentUserId;

  // Prevent rendering if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow px-4 py-16 mt-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-[#1B3A5C] to-[#2a527a]" />
            <div className="p-4 space-y-3">
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Mes lobbies</h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
                  {participatedSessions.length + (ownedSession ? 1 : 0)} actifs
                </p>
              </div>

              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {[...(ownedSession ? [ownedSession] : []), ...participatedSessions].map((session) => {
                  const isCurrent = seance?.id === session.id;
                  const isSessionOwner = session.proprietaire_id === currentUserId;
                  return (
                    <button
                      key={session.id}
                      onClick={() => handleSessionSelected(session)}
                      className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                        isCurrent
                          ? "border-[#1B3A5C] bg-[#1B3A5C] text-white"
                          : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm truncate">{session.nom}</p>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            isCurrent
                              ? "bg-white/20 text-white"
                              : isSessionOwner
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isSessionOwner ? "MASTER" : "INVITÉ"}
                        </span>
                      </div>
                      <div className={`text-xs mt-1 ${isCurrent ? "text-white/80" : "text-gray-500"}`}>
                        Code: {session.code}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Barre de progression */}
          <div className="h-1.5 bg-gradient-to-r from-[#C84B31] to-orange-400" />

          {/* Steps */}
          <div className="flex items-center justify-center gap-6 px-8 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="uppercase text-xs tracking-widest">Configuration</span>
            </div>
            <div className="h-px flex-1 bg-gray-200" />
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1B3A5C]">
              <div className="w-6 h-6 rounded-full bg-[#1B3A5C] text-white flex items-center justify-center text-xs font-bold">2</div>
              <span className="uppercase text-xs tracking-widest">Équipe</span>
              <span className="text-xs text-gray-400 font-normal">Inviter & Lancer</span>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">

            {/* Titre + compteur */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">👥</div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
                  Invitez votre équipe
                </h1>
                <p className="text-xs text-gray-400 uppercase tracking-widest">
                  Partagez le code ou invitez par mail pour commencer
                </p>
              </div>
              <div className="ml-auto">
                <span className="bg-[#1B3A5C] text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
                  ● {participants.length} CONNECTÉ{participants.length > 1 ? "S" : ""}
                </span>
              </div>
            </div>

            {/* Code salle */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <span>📋</span>
                  <span>Code salle</span>
                </div>
                <span className="text-green-500 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full text-xs">
                  {seance.statut === "en_cours" ? "EN COURS" : "OUVERTE"}
                </span>
              </div>
              <p className="text-3xl font-black text-center tracking-[0.3em] text-[#1B3A5C] font-mono">
                {seance.code}
              </p>
              <button
                onClick={handleCopyCode}
                className="w-full bg-[#1B3A5C] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#14305a] transition-colors"
              >
                📋 {copied ? "Copié !" : "Copier le code"}
              </button>
            </div>

            {/* Participants */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                <span>👤</span>
                <span>Connectés</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{participants.length}</span>
              </div>

              <div className="space-y-2">
                {participants.map((p) => {
                  const isHost = p.utilisateur_id === seance.proprietaire_id;
                  const name = p.utilisateur?.nom ?? p.utilisateur_id.slice(0, 8);
                  const colorIndex = (p.utilisateur_id.codePointAt(0) ?? 0) % AVATAR_COLORS.length;
                  return (
                    <div key={p.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                      <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[colorIndex]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm">
                          {name.toUpperCase()}
                          {isHost && <span className="ml-2 text-xs text-gray-400 font-normal">(hôte)</span>}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-xs text-green-600 font-medium">PRÊT</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                        <span>🎬</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full" />
                        <span className="font-mono">0/{seance.max_films}</span>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-gray-400 text-sm">
                  <span>+</span>
                  <span>En attente de joueurs...</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleLeave}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-semibold px-4 py-3 border border-red-200 hover:border-red-400 rounded-xl transition-colors"
              >
                🚪 Quitter la session
              </button>

              {/* Show "View All Sessions" button if user has multiple sessions */}
              {(participatedSessions.length + (ownedSession ? 1 : 0)) > 1 && (
                <button
                  onClick={() => setShowSessionSelector(true)}
                  className="flex items-center gap-2 text-sm text-[#1B3A5C] hover:text-[#14305a] font-semibold px-4 py-3 border border-[#1B3A5C] hover:border-[#14305a] rounded-xl transition-colors"
                >
                  📋 Toutes les sessions
                </button>
              )}

              {isOwner ? (
                seance.statut === "en_cours" ? (
                  <button
                    onClick={handleGoToSelection}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1B3A5C] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#14305a] transition-colors"
                  >
                    🎬 Aller à la sélection
                  </button>
                ) : (
                  <button
                    onClick={handleLaunch}
                    disabled={launching || participants.length < 1}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1B3A5C] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#14305a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    👥 {launching ? "Lancement..." : "Lancer la session maintenant"} →
                  </button>
                )
              ) : (
                seance.statut === "en_cours" ? (
                  <button
                    onClick={handleGoToSelection}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1B3A5C] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#14305a] transition-colors"
                  >
                    🎬 Rejoindre la sélection
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-400 py-3 rounded-xl text-sm">
                    En attente que l&apos;hôte lance la session...
                  </div>
                )
              )}
            </div>
          </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
