"use client";

import { Suspense } from "react";
import CallbackClient from "./callback-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Connexion en cours...</div>}>
      <CallbackClient />
    </Suspense>
  );
}

