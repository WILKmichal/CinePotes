"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type Profile = {
  id: string;
  nom: string;
  email: string;
  role: string;
  email_verifie: boolean;
  cree_le: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [newName, setNewName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProfile = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/");
      return;
    }

    try {
      setError(null);

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("access_token");
        router.replace("/");
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt}`);
      }

      const data: Profile = await res.json();
      setProfile(data);
      setNewName(data.nom ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleSaveName = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/");
      return;
    }

    if (!newName.trim()) {
      setError("Le nom est requis");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const res = await fetch(`${API_URL}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nom: newName.trim() }),
      });

      if (res.status === 401) {
        localStorage.removeItem("access_token");
        router.replace("/");
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt}`);
      }

      const updated: Profile = await res.json();
      setProfile(updated);
      setNewName(updated.nom ?? "");
      setIsEditingName(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/");
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const res = await fetch(`${API_URL}/auth/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("access_token");
        router.replace("/");
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} - ${txt}`);
      }

      localStorage.removeItem("access_token");
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-grow flex flex-col items-center px-4 py-24 md:py-32">
        <div className="max-w-3xl w-full">
          <section className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Mon Profil</h1>

            {loading && <p className="text-center text-gray-500">Chargement...</p>}
            {error && <p className="text-center text-red-600 mb-4">{error}</p>}

            {!loading && !error && profile && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <img
                    src="https://img.icons8.com/fluent/48/000000/user-male-circle.png"
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover border border-gray-300 mx-auto"
                  />
                  <p>
                    <strong>Email:</strong> {profile.email}
                  </p>
                  <p>
                    <strong>Rôle:</strong> {profile.role}
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Nom</label>

                  {!isEditingName ? (
                    <div className="flex items-center gap-2">
                      <p className="border rounded px-3 py-2 w-full bg-gray-50">{profile.nom}</p>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        className="px-4 py-2 rounded bg-gray-900 text-white"
                      >
                        Modifier
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Votre nom"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveName}
                          disabled={isSaving}
                          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                        >
                          {isSaving ? "Enregistrement..." : "Enregistrer"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewName(profile.nom);
                            setIsEditingName(false);
                          }}
                          className="px-4 py-2 rounded bg-gray-200 text-gray-800"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="max-w-md mx-auto pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && !profile && (
              <p className="text-center text-gray-500">Aucune donnée profil.</p>
            )}
          </section>
        </div>
      </main>
      <Footer />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Confirmation</h2>
            <p className="text-gray-700 mb-4">
              Êtes-vous sûr de vouloir supprimer votre compte ?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800"
                disabled={isDeleting}
              >
                Non
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Oui"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
