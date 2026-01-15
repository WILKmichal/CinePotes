"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header, Footer, DetailsFilm } from "@/components/utils";
import DetailsFilms from "@/components/detailsFilms";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [film, setFilm] = useState<DetailsFilm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilm = async () => {
      try {
        const res = await fetch(`http://localhost:3333/tmdb/${id}`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setFilm(data);
      } catch (e) {
        setError("Impossible de charger les détails du film");
      } finally {
        setLoading(false);
      }
    };

    fetchFilm();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      <Header />
      <main className="flex-grow">
        {loading && <p className="text-center mt-20">Chargement...</p>}
        {error && <p className="text-center mt-20 text-red-600">{error}</p>}
        {!loading && !error && film && <DetailsFilms film={film} />}
      </main>
      <Footer />
    </div>
  );
}
