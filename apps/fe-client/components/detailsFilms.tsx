"use client";

interface DetailsFilm {
  id: number;
  titre: string;
  resume: string;
  date_sortie: string;
  affiche_url: string | null;
  note_moyenne: number;
}

export default function DetailsFilms({ film }: { film: DetailsFilm }) {
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
          <h1 className="text-3xl font-bold mb-4">{film.titre}</h1>
          <p className="text-gray-600 mb-4">{film.resume}</p>

          <p className="text-sm text-gray-500">
            📅 {film.date_sortie || "N/A"}
          </p>

          <p className="text-sm text-yellow-500 mt-2">
            ⭐ {film.note_moyenne.toFixed(1)} / 10
          </p>
        </div>
      </div>
    </div>
  );
}
