"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

interface Liste {
  id: string;
  nom: string;
  description?: string;
}

interface AddToListModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly tmdbId: number;
  readonly filmTitle: string;
}

export function AddToListModal({ isOpen, onClose, tmdbId, filmTitle }: AddToListModalProps) {
  const [listes, setListes] = useState<Liste[]>([]);
  const [selectedListes, setSelectedListes] = useState<string[]>([]);
  const [newListName, setNewListName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  };

  // Charger les listes de l'utilisateur
  useEffect(() => {
    if (!isOpen) return;

    const fetchListes = async () => {
      const token = getToken();
      if (!token) {
        setError("Vous devez être connecté pour gérer vos listes");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/lists`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Erreur lors du chargement des listes");
        const data = await res.json();
        setListes(data);
      } catch {
        setError("Impossible de charger vos listes");
      }
    };

    fetchListes();
  }, [isOpen]);

  // Créer une nouvelle liste
  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nom: newListName.trim() }),
      });

      if (!res.ok) throw new Error("Erreur lors de la création");

      const newList = await res.json();
      setListes([newList, ...listes]);
      setNewListName("");
      setSuccess(`Liste "${newList.nom}" créée`);
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Impossible de créer la liste");
    } finally {
      setLoading(false);
    }
  };

  // Toggle sélection d'une liste
  const toggleListSelection = (listeId: string) => {
    setSelectedListes((prev) =>
      prev.includes(listeId)
        ? prev.filter((id) => id !== listeId)
        : [...prev, listeId]
    );
  };

  // Ajouter le film aux listes sélectionnées
  const handleAddToLists = async () => {
    if (selectedListes.length === 0) {
      setError("Sélectionnez au moins une liste");
      return;
    }

    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const promises = selectedListes.map((listeId) =>
        fetch(`${API_URL}/lists/${listeId}/films`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tmdbId }),
        })
      );

      await Promise.all(promises);
      setSuccess(`"${filmTitle}" ajouté à ${selectedListes.length} liste(s)`);
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch {
      setError("Erreur lors de l'ajout du film");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Ajouter à une liste</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Film : <strong>{filmTitle}</strong>
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 px-3 py-2 rounded mb-4 text-sm">
            {success}
          </div>
        )}

        {/* Créer une nouvelle liste */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Créer une nouvelle liste
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Nom de la liste"
              className="flex-1 px-3 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateList();
              }}
            />
            <button
              onClick={handleCreateList}
              disabled={loading || !newListName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Créer
            </button>
          </div>
        </div>

        {/* Liste des listes existantes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vos listes ({listes.length})
          </label>
          <div className="max-h-48 overflow-y-auto border rounded-lg">
            {listes.length === 0 ? (
              <p className="p-4 text-center text-gray-500 text-sm">
                Aucune liste. Créez-en une !
              </p>
            ) : (
              listes.map((liste) => (
                <label
                  key={liste.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedListes.includes(liste.id)}
                    onChange={() => toggleListSelection(liste.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-900">{liste.nom}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleAddToLists}
            disabled={loading || selectedListes.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Ajout..." : `Ajouter (${selectedListes.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
