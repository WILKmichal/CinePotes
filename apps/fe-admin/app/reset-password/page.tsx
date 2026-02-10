import { Suspense } from "react";
import ResetPassword from "../Component/reset-password";

export default function ResetPasswordPage() {
  return(
    <Suspense fallback={<div className="p-6">Chargement...</div>}>
      <ResetPassword />
    </Suspense>
  );
}
