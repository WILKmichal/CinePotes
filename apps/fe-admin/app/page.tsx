"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [nom, setNom] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const token = data?.access_token ?? data?.token ?? null;
          if (!token) {
            setError("Réponse inattendue du serveur (token manquant).");
            setLoading(false);
            return;
          }
          localStorage.setItem("access_token", token);
          router.push("/dashboard");
        } else {
          setError(data?.message || "Identifiants incorrects.");
        }
      } else {
        // register
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom, email: username, password, role }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok || res.status === 201) {
          alert("Inscription réussie — vous pouvez maintenant vous connecter");
          setMode("login");
          setPassword("");
        } else {
          setError(data?.message || "Erreur lors de la création du compte.");
        }
      }
    } catch (err) {
      console.error("Erreur fetch:", err);
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">
          {mode === "login" ? "Connexion" : "Inscription"}
        </h1>

        <div className="text-center mb-4">
          <button
            onClick={() => setMode("login")}
            className={`px-4 py-2 rounded-l-lg ${mode === "login" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode("register")}
            className={`px-4 py-2 rounded-r-lg ${mode === "register" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Inscription
          </button>
        </div>

        {error && (
          <p className="bg-red-100 text-red-600 px-4 py-2 rounded-lg mb-4 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          {mode === "register" && (
            <div>
              <label className="block mb-1 font-medium text-gray-700">Nom</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Votre nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block mb-1 font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Entrez votre email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block mb-1 font-medium text-gray-700">Rôle</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                <option value="user">user</option>
                <option value="chef">chef</option>
                <option value="admin">admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-md disabled:opacity-60"
          >
            {loading ? "Traitement..." : mode === "login" ? "Se connecter" : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}
