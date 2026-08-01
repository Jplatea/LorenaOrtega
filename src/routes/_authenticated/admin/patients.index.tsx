import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, UserPlus, ChevronRight, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/patients/")({
  component: PatientsList,
});

function PatientsList() {
  const [q, setQ] = useState("");
  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone, last_sign_in_at, created_at, is_active")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = (patients ?? []).filter((p) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(s) ||
      p.email?.toLowerCase().includes(s) ||
      p.phone?.toLowerCase().includes(s)
    );
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
            <p className="text-muted-foreground text-sm mt-1">{filtered.length} resultados</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/recipes"
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground border border-border px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90"
              style={{ background: "var(--gradient-hero, hsl(var(--accent)))", color: "hsl(var(--primary-foreground))" }}
            >
              <BookOpen className="h-4 w-4" />
              Recetas
            </Link>
            <Link
              to="/admin/patients/new"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90"
            >
              <UserPlus className="h-4 w-4" />
              Nuevo paciente
            </Link>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-muted-foreground">Sin pacientes.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/admin/patients/$id"
                    params={{ id: p.id }}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-medium">
                        {(p.first_name?.[0] ?? "") + (p.last_name?.[0] ?? "")}
                      </div>
                      <div>
                        <div className="font-medium">
                          {p.first_name} {p.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">{p.email}</div>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right text-xs text-muted-foreground">
                      Último acceso:{" "}
                      {p.last_sign_in_at ? new Date(p.last_sign_in_at).toLocaleDateString("es-ES") : "—"}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
