"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface JoinLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Seance {
  id: string;
  nom: string;
  code: string;
  statut: "en_attente" | "en_cours" | "terminee" | "annulee";
  max_films: number;
  proprietaire_id: string;
}

const getToken = () =>
  globalThis.window !== undefined ? sessionStorage.getItem("access_token") : null;

export default function JoinLobbyModal({ isOpen, onClose }: JoinLobbyModalProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [submittingName, setSubmittingName] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) return;

    const token = getToken();

    if (token) {
      // Logged in user
      setJoining(true);
      setJoinError(null);
      try {
        const res = await fetch(`${API_URL}/seances/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: code.trim().toUpperCase() }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const seance = (data as { seance?: Seance }).seance;
          if (seance) {
            // Store the session ID as the current selected session
            localStorage.setItem("current_session_id", seance.id);
            // Keep old storage for backward compatibility during transition
            localStorage.setItem("joined_seance", JSON.stringify(seance));
          }
          onClose();
          router.push("/lobby");
        } else if (res.status === 409) {
          // User already in this session, just navigate
          onClose();
          router.push("/lobby");
        } else {
          const data = await res.json().catch(() => ({}));
          setJoinError(
            (data as { message?: string }).message ??
              "Code invalide ou session introuvable"
          );
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
      
      // Check if already a guest with an active session
      const existingSessionId = localStorage.getItem("current_session_id");
      if (existingSessionId && typeof window !== "undefined") {
        const isGuest = sessionStorage.getItem("is_guest") === "true";
        if (isGuest) {
          setJoinError("As a guest, you can only join one lobby at a time. Please leave your current lobby first.");
          setJoining(false);
          return;
        }
      }
      
      try {
        const res = await fetch(
          `${API_URL}/seances/by-code/${code.trim().toUpperCase()}`
        );
        if (res.ok) {
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
    try {
      const guestRes = await fetch(`${API_URL}/auth/guest-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: guestName.trim() }),
      });
      if (!guestRes.ok) {
        const data = await guestRes.json().catch(() => ({}));
        setJoinError(
          (data as { message?: string }).message ??
            "Erreur lors de la création du compte invité"
        );
        setSubmittingName(false);
        return;
      }

      const guestData = await guestRes.json();
      sessionStorage.setItem("access_token", guestData.access_token);
      sessionStorage.setItem("is_guest", "true");
      sessionStorage.setItem("display_name", guestData.displayName);

      const joinRes = await fetch(`${API_URL}/seances/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${guestData.access_token}`,
        },
        body: JSON.stringify({ code: pendingCode }),
      });
      if (joinRes.ok) {
        const data = await joinRes.json().catch(() => ({}));
        const seance = (data as { seance?: Seance }).seance;
        if (seance) {
          // Store the session ID as the current selected session
          localStorage.setItem("current_session_id", seance.id);
          // Keep old storage for backward compatibility during transition
          localStorage.setItem("joined_seance", JSON.stringify(seance));
        }
        onClose();
        router.push("/lobby");
      } else {
        const data = await joinRes.json().catch(() => ({}));
        setJoinError(
          (data as { message?: string }).message ??
            "Erreur lors de la connexion à la session"
        );
        setPendingCode(null);
        setGuestName("");
      }
    } catch {
      setJoinError("Erreur de connexion au serveur");
    } finally {
      setSubmittingName(false);
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset state when closing
    setCode("");
    setPendingCode(null);
    setGuestName("");
    setJoinError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {!pendingCode ? "Rejoindre un Lobby" : "Entrez votre nom"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {!pendingCode ? (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="modal-code-input"
                className="text-xs font-semibold text-gray-500 uppercase tracking-widest"
              >
                Session Code
              </label>
              <input
                id="modal-code-input"
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().slice(0, 6))
                }
                placeholder="ABC123"
                maxLength={6}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-2xl font-mono font-bold text-center tracking-[0.3em] text-[#1B3A5C] focus:outline-none focus:border-[#1B3A5C] transition-colors"
              />
            </div>
            {joinError && (
              <p className="text-sm text-red-500 text-center">{joinError}</p>
            )}
            <button
              type="submit"
              disabled={joining || code.trim().length !== 6}
              className="w-full bg-[#1B3A5C] text-white py-3 rounded-xl font-semibold hover:bg-[#14305a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? "Vérification..." : "Continue →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleGuestNameSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Entrez votre nom pour rejoindre la session
            </p>
            <div className="space-y-1">
              <label
                htmlFor="modal-guest-name-input"
                className="text-xs font-semibold text-gray-500 uppercase tracking-widest"
              >
                Your Name
              </label>
              <input
                id="modal-guest-name-input"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your nickname..."
                maxLength={50}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#1B3A5C] transition-colors"
                autoFocus
              />
            </div>
            {joinError && (
              <p className="text-sm text-red-500 text-center">{joinError}</p>
            )}
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
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
