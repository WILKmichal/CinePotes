"use client";
import { useState } from "react";
import { DetailsFilm } from "@/components/utils";
import AddToListModal from "@/components/AddToListModal";

const getIsLoggedIn = () => {
  if (globalThis.window !== undefined) {
    return !!localStorage.getItem("access_token");
  }
  return false;
};

export default function DetailsFilms({ film }: Readonly<{ film: DetailsFilm }>) {
  const [showModal, setShowModal] = useState(false);
  const [isLoggedIn] = useState(getIsLoggedIn);

  return (
    <div className="max-w-4xl mx-auto px-6 py-32">
      <div className="flex gap-8">
        {film.affiche_url ? (
          <img
            src={film.affiche_url}
            alt={film.titre}
            className="w-64 rounded-lg shadow"
          />
        ) : (
          <div className="w-64 h-96 bg-gray-200 rounded flex items-center justify-center text-gray-500">
            Aucune image
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold mb-4 text-gray-900">{film.titre}</h1>
          <p className="text-gray-600 mb-4">{film.resume}</p>

          <p className="text-sm text-gray-500">
            📅 {film.date_sortie || "N/A"}
          </p>

          <p className="text-sm text-yellow-500 mt-2">
            ⭐ {film.note_moyenne.toFixed(1)} / 10
          </p>

          {isLoggedIn && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <span>+</span> Ajouter à une liste
            </button>
          )}
        </div>
      </div>

      <AddToListModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tmdbId={film.id}
        filmTitle={film.titre}
      />
    </div>
  );
}
