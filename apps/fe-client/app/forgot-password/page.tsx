"use client";

import { Suspense } from "react";
import ForgotPasswordPage from "../Component/forgot-password";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Chargement...</div>}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
