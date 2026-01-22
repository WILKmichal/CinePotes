"use client";

import { Suspense } from "react";
import LoginClient from "./Component/login-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Chargement...</div>}>
      <LoginClient />
    </Suspense>
  );
}
