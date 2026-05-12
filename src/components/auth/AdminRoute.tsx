import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { fetchAdminAccess } from "@/services/adminAccessApi";

export function AdminRoute() {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      try {
        await fetchAdminAccess();
        if (active) setStatus("allowed");
      } catch {
        if (active) setStatus("denied");
      }
    };

    checkAccess();

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Verifying admin access...
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return <Outlet />;
}
