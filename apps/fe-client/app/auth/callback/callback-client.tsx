"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
/*
Recuperation du token a partir de l url
stocker dans local storage
redirection vers fe client app.page.tsx */
export default function AuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = params.get("token");

    if (token) {
      localStorage.setItem("access_token", token);
      router.replace("/");
    } else {
      router.replace("/");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Connexion en cours...</p>
    </div>
  );
}