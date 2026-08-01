import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/lib/auth-hooks";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRouter,
});

function DashboardRouter() {
  const { data, isLoading } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !data) return;
    if (data.role === "admin") navigate({ to: "/admin", replace: true });
    else navigate({ to: "/patient", replace: true });
  }, [data, isLoading, navigate]);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
