"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Token manquant dans l’URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      console.log("API_BASE =", API_BASE);
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Lien invalide ou expiré.");
        return;
      }

      setMessage("Mot de passe modifié avec succès.");
      setTimeout(() => router.push("/"), 1000);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-4">
          Réinitialiser le mot de passe
        </h1>

        {message && (
          <p className="bg-green-100 text-green-700 px-4 py-2 rounded-lg mb-4 text-center">
            {message}
          </p>
        )}

        {error && (
          <p className="bg-red-100 text-red-600 px-4 py-2 rounded-lg mb-4 text-center">
            {error}
          </p>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block mb-1 font-medium">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Traitement..." : "Mettre à jour"}
          </button>
        </form>
      </div>
    </div>
  );
}
