import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Utensils,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Cookie,
  Salad,
  Library,
} from "lucide-react";
import { useCurrentUser } from "@/lib/auth-hooks";
import { AppShell } from "@/components/app-shell";
import { DAYS, formatDateEs } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/patient/")({
  head: () => ({ meta: [{ title: "Mi semana — Lorena Ortega Dietética" }] }),
  component: PatientHome,
});

const dayIcons = [Sunrise, Sun, Utensils, Salad, Sunset, Cookie, Moon];

function PatientHome() {
  const { data: user } = useCurrentUser();

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <p className="text-sm text-muted-foreground capitalize">{formatDateEs(new Date())}</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">
            Hola, {user?.profile?.first_name || "bienvenido"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Elige un día para ver tu plan de comidas.</p>
        </div>

        <section aria-labelledby="days-heading">
          <h2 id="days-heading" className="sr-only">Días de la semana</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {DAYS.map((d, i) => {
              const Icon = dayIcons[i];
              return (
                <Link
                  key={d.id}
                  to="/patient/day/$day"
                  params={{ day: String(d.id) }}
                  className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)] transition-all"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Día</div>
                    <div className="font-semibold text-lg mt-0.5">{d.label}</div>
                  </div>
                </Link>
              );
            })}

            <Link
              to="/patient/library"
              className="group bg-primary text-primary-foreground rounded-2xl p-5 hover:opacity-95 transition-all"
              style={{ background: "var(--gradient-hero)" }}
            >
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Library className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider opacity-80">Recursos</div>
                <div className="font-semibold text-lg mt-0.5">Biblioteca</div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
