import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DocumentsSection } from "@/components/documents-section";
import { useCurrentUser } from "@/lib/auth-hooks";

export const Route = createFileRoute("/_authenticated/patient/library")({
  component: PatientLibrary,
});

function PatientLibrary() {
  const { data: user, isLoading } = useCurrentUser();

  return (
    <AppShell>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight">Biblioteca</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Guías, recetas, analíticas y otros documentos que comparte tu nutricionista.
        </p>

        <div className="mt-6">
          {isLoading || !user ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </div>
          ) : (
            <DocumentsSection patientId={user.id} canManage={false} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
