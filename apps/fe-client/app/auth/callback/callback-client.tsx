"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function CallbackClient() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = params.get("token");

    if (token) {
      localStorage.setItem("access_token", token);
      router.replace("/"); // ✅ ICI UNIQUEMENT
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
