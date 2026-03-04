"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function CallbackClient() {
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");

    if (token) {
      sessionStorage.setItem("access_token", token);
    }
    globalThis.location.replace("/");
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Connexion en cours...</p>
    </div>
  );
}

