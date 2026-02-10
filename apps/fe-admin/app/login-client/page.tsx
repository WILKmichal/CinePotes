import { Suspense } from "react";
import LoginClient from "../Component/login-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement...</div>}>
      <LoginClient />
    </Suspense>
  );
}
