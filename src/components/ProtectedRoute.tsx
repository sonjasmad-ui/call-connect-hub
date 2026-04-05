import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const hasAccess = sessionStorage.getItem("dashboard_access") === "granted";

  if (!hasAccess) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
