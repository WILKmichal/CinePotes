"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { Header, Footer, DetailsFilm } from "@/components/utils";
import DetailsFilms from "@/components/detailsFilms";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";


function FilmDetailsContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [film, setFilm] = useState<DetailsFilm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("ID du film manquant");
      setLoading(false);
      return;
    }

    const fetchFilm = async () => {
      try {
        const res = await fetch(`${API_URL}/library/${id}`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setFilm(data);
      } catch (e) {
        setError(`Impossible de charger les détails du film: ${e}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFilm();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
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

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FilmDetailsContent />
    </Suspense>
  );
}
