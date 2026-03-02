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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/");
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`HTTP ${res.status} - ${txt}`);
        }
        const data: Profile = await res.json();
        setProfile(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-grow flex flex-col items-center px-4 py-24 md:py-32">
        <div className="max-w-3xl w-full">
          <section className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Mon Profil</h1>

            {loading && <p className="text-center text-gray-500">Chargement...</p>}
            {error && <p className="text-center text-red-600">{error}</p>}

            {!loading && !error && profile && (
              <div className="space-y-3 text-center">
                <img
                  src="https://img.icons8.com/fluent/48/000000/user-male-circle.png"
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover border border-gray-300 mx-auto"
                />
                <p><strong>Nom:</strong> {profile.nom}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Rôle:</strong> {profile.role}</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
