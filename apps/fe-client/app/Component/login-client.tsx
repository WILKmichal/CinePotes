"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";


export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [username, setUsername] = useState("");
  const [nom, setNom] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
  const requestedMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(requestedMode);

useEffect(() => {
  setMode(requestedMode);
}, [requestedMode]);


  const onLoginSuccess = (token: string) => {
    sessionStorage.setItem("access_token", token);

    if (redirect) {
      router.push(redirect);
      return;
    }

    router.push("/");
  };

  const doLogin = async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username, // ✅ uniquement ce que le DTO attend
        password,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        Array.isArray(data?.message) ? data.message.join(" / ") : data?.message;
      setError(msg || "Identifiants incorrects.");
      return;
    }

    const token =
      data?.access_token ?? data?.token ?? data?.accessToken ?? null;

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
      body: JSON.stringify({ nom, email: username, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!(res.ok || res.status === 201)) {
      const msg =
        Array.isArray(data?.message) ? data.message.join(" / ") : data?.message;
      setError(msg || "Erreur lors de la création du compte.");
      return;
    }

    setSuccess("Inscription réussie — vous pouvez maintenant vous connecter");
    setMode("login");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");
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

  const buttonText = loading
    ? "Traitement..."
    : mode === "login"
    ? "Se connecter"
    : "S'inscrire";

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

        {success && (
          <p className="bg-green-100 text-green-600 px-4 py-2 rounded-lg mb-4 text-center">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off" noValidate>
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
                name="name"
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                placeholder="Votre nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                autoComplete="name"
                data-form-type="other"
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
              name="email"
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              placeholder="Entrez votre email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete={mode === "login" ? "username" : "email"}
              data-form-type="other"
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
              name="password"
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              data-form-type="other"
            />
          </div>

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="text-sm text-blue-600 hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-md disabled:opacity-60"
          > 
            {buttonText}
          </button>
        </form>
      </div>
    </div>
  );
}
