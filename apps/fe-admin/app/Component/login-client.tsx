"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [nom, setNom] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

  const onLoginSuccess = (token: string) => {
    localStorage.setItem("access_token", token);

    if (redirect) {
      location.href = `${redirect}?token=${encodeURIComponent(token)}`;
      return;
    }

    router.push("/");
  };

  const doLogin = async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.message || "Identifiants incorrects.");
      return;
    }

    const token = data?.access_token ?? data?.token ?? null;
    if (!token) {
      setError("Réponse inattendue du serveur (token manquant).");
      return;
    }

    onLoginSuccess(token);
  };

  const doRegister = async () => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, email: username, password, role }),
    });

    const data = await res.json().catch(() => ({}));

    if (!(res.ok || res.status === 201)) {
      setError(data?.message || "Erreur lors de la création du compte.");
      return;
    }

    alert("Inscription réussie — vous pouvez maintenant vous connecter");
    setMode("login");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await doLogin();
      } else {
        await doRegister();
      }
    } catch (err) {
      console.error("Erreur fetch:", err);
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return "Traitement...";
    return mode === "login" ? "Se connecter" : "S'inscrire";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">
          {mode === "login" ? "Connexion" : "Inscription"}
        </h1>

        <div className="text-center mb-4">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`px-4 py-2 rounded-l-lg ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-900"
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`px-4 py-2 rounded-r-lg ${
              mode === "register"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-900"
            }`}
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
              <label
                htmlFor="nom"
                className="block mb-1 font-medium text-gray-700"
              >
                Nom
              </label>
              <input
                id="nom"
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                placeholder="Votre nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block mb-1 font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              placeholder="Entrez votre email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-1 font-medium text-gray-700"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </div>

          {mode === "register" && (
            <div>
              <label
                htmlFor="role"
                className="block mb-1 font-medium text-gray-700"
              >
                Rôle
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white"
              >
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
            {getButtonText()}
          </button>
        </form>
      </div>
    </div>
  );
}
