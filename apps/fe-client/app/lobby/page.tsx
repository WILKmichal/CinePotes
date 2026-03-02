"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/utils";

const API_URL = process.env.NEXT_PUBLIC_API_BG_URL ?? "http://localhost:3002";

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

const getToken = () =>
  globalThis.window !== undefined ? localStorage.getItem("access_token") : null;

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

  // Rejoindre
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Créer
  const [nom, setNom] = useState("");
  const [maxFilms, setMaxFilms] = useState(3);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) return;
    const token = getToken();
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
        // Stocker la séance pour les participants (non-propriétaires)
        const seance = (data as { seance?: Seance }).seance;
        if (seance) localStorage.setItem("joined_seance", JSON.stringify(seance));
        onEntered();
      } else if (res.status === 409) {
        // Déjà dans cette séance : récupérer la séance depuis /seances/self
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

            {/* Onglets */}
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

            {/* Rejoindre */}
            {tab === "join" && (
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
                  {joining ? "Connexion..." : "Rejoindre →"}
                </button>
              </form>
            )}

            {/* Créer */}
            {tab === "create" && (
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
              ← Retour à l'accueil
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─── Page lobby (session active) ──────────────────────────────────────────────

export default function LobbyPage() {
  const router = useRouter();
  const [seance, setSeance] = useState<Seance | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNoSession, setHasNoSession] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [launching, setLaunching] = useState(false);

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

  const loadSeance = useCallback(async (showLoader = false) => {
    const token = getToken();
    if (!token) { router.push("/"); return; }

    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/seances/self`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data: Seance | null = await res.json();
        if (data) {
          // Redirection auto vers /selection uniquement depuis le polling (pas navigation manuelle)
          if (data.statut === "en_cours" && !showLoader) {
            router.push(`/selection?seanceId=${data.id}`);
            return;
          }
          // Si séance en cours et navigation manuelle : afficher le lobby normalement
          if (data.statut !== "en_cours") {
            setHasNoSession(false);
            setSeance(data);
            await fetchParticipants(data.id);
          } else {
            setHasNoSession(true);
          }
          return;
        }
      }

      // Fallback : l'utilisateur est participant (pas propriétaire)
      const joinedRaw = localStorage.getItem("joined_seance");
      if (joinedRaw) {
        try {
          const joinedSeance: Seance = JSON.parse(joinedRaw) as Seance;
          // Vérifier que la séance est toujours active via ses participants
          const res2 = await fetch(`${API_URL}/seances/${joinedSeance.id}/participants`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res2.ok) {
            if (joinedSeance.statut === "en_cours" && !showLoader) {
              router.push(`/selection?seanceId=${joinedSeance.id}`);
              return;
            }
            if (joinedSeance.statut === "en_cours") {
              localStorage.removeItem("joined_seance");
              setHasNoSession(true);
              return;
            }
            setHasNoSession(false);
            setSeance(joinedSeance);
            const parts = await res2.json();
            setParticipants(parts);
            return;
          }
        } catch {
          // JSON invalide, nettoyer
        }
        localStorage.removeItem("joined_seance");
      }

      setHasNoSession(true);
    } catch {
      setHasNoSession(true);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [router, fetchParticipants]);

  useEffect(() => {
    loadSeance(true);
  }, [loadSeance]);

  // Polling uniquement quand une séance est active (pas sur le formulaire)
  useEffect(() => {
    if (hasNoSession) return;
    const interval = setInterval(() => loadSeance(false), 5000);
    return () => clearInterval(interval);
  }, [hasNoSession, loadSeance]);

  const handleCopyCode = async () => {
    if (!seance) return;
    await navigator.clipboard.writeText(seance.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail("");
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
    setSeance(null);
    setHasNoSession(true);
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

  if (hasNoSession || !seance) {
    return <NoSessionPage onEntered={() => loadSeance(true)} />;
  }

  const isOwner = seance.proprietaire_id === currentUserId;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow flex items-center justify-center px-4 py-16 mt-16">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">

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

            {/* Code + email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Code salle</span>
                  </div>
                  <span className="text-green-500 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full text-xs">
                    OUVERT
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

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  <span>✉️</span>
                  <span>Inviter par email</span>
                </div>
                <form onSubmit={handleInviteByEmail} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="adresse@mail.com"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"
                  />
                  <button type="submit" className="bg-[#1B3A5C] text-white px-4 py-2.5 rounded-xl hover:bg-[#14305a] transition-colors">
                    ➤
                  </button>
                </form>
              </div>
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

              {isOwner ? (
                <button
                  onClick={handleLaunch}
                  disabled={launching || participants.length < 1}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1B3A5C] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#14305a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  👥 {launching ? "Lancement..." : "Lancer la session maintenant"} →
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-400 py-3 rounded-xl text-sm">
                  En attente que l'hôte lance la session...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
