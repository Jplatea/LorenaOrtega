import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Activity, UserPlus, Clock, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useCurrentUser } from "@/lib/auth-hooks";
import { formatDateEs } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Panel — Lorena Ortega Dietética" }] }),
  component: AdminHome,
});

function AdminHome() {
  const { data: user } = useCurrentUser();
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: total }, { count: active }, { data: recent }, { data: latestSignIn }] =
        await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase
            .from("profiles")
            .select("id, first_name, last_name, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("profiles")
            .select("id, first_name, last_name, last_sign_in_at")
            .not("last_sign_in_at", "is", null)
            .order("last_sign_in_at", { ascending: false })
            .limit(5),
        ]);
      return { total: total ?? 0, active: active ?? 0, recent: recent ?? [], latestSignIn: latestSignIn ?? [] };
    },
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground capitalize">{formatDateEs(new Date())}</p>
            <h1 className="text-3xl font-semibold tracking-tight mt-1">
              Buenos días, {user?.profile?.first_name || "Lorena"}
            </h1>
            <p className="text-muted-foreground mt-1">Resumen general de la clínica.</p>
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat icon={Users} label="Pacientes totales" value={stats?.total ?? 0} />
          <Stat icon={Activity} label="Pacientes activos" value={stats?.active ?? 0} />
          <Stat icon={UserPlus} label="Nuevos (últimos)" value={stats?.recent.length ?? 0} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Últimos accesos" icon={Clock}>
            {stats?.latestSignIn?.length ? (
              <ul className="divide-y divide-border">
                {stats.latestSignIn.map((p) => (
                  <li key={p.id} className="py-3 flex items-center justify-between">
                    <Link to="/admin/patients/$id" params={{ id: p.id }} className="font-medium hover:text-primary">
                      {p.first_name} {p.last_name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {p.last_sign_in_at ? new Date(p.last_sign_in_at).toLocaleString("es-ES") : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin registros aún.</p>
            )}
          </Card>

          <Card title="Pacientes recientes" icon={UserPlus}>
            {stats?.recent?.length ? (
              <ul className="divide-y divide-border">
                {stats.recent.map((p) => (
                  <li key={p.id} className="py-3 flex items-center justify-between">
                    <Link to="/admin/patients/$id" params={{ id: p.id }} className="font-medium hover:text-primary">
                      {p.first_name} {p.last_name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay pacientes registrados.</p>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="h-9 w-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-3xl font-semibold mt-2">{value}</div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
