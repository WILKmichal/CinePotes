import { Suspense } from "react";
import ForgotPassword from "../Component/forgot-password";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement...</div>}>
      <ForgotPassword />
    </Suspense>
  );
}
