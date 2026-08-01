import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Leaf, LayoutDashboard, Users, Library, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/auth-hooks";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/auth", replace: true });
  }

  const isAdmin = user?.role === "admin";
  const nav = isAdmin
    ? [
        { to: "/admin", label: "Panel", icon: LayoutDashboard },
        { to: "/admin/patients", label: "Pacientes", icon: Users },
      ]
    : [
        { to: "/patient", label: "Mi semana", icon: LayoutDashboard },
        { to: "/patient/library", label: "Biblioteca", icon: Library },
      ];

  const displayName = user?.profile
    ? `${user.profile.first_name} ${user.profile.last_name}`.trim() || user.email
    : user?.email ?? "";

  return (
    <div className="min-h-dvh app-aurora">
      <header className="sticky top-0 z-30 bg-background/70 backdrop-blur-xl border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-2 text-primary">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/15 flex items-center justify-center">
              <Leaf className="h-4 w-4" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">Lorena Ortega</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">Dietética</div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden md:flex items-center gap-1 rounded-full bg-card/60 backdrop-blur border border-border/60 p-1 shadow-soft">
              {nav.map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={
                      "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all " +
                      (active
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right leading-tight">
                <div className="text-sm font-medium truncate max-w-[160px]">{displayName}</div>
                <div className="text-[11px] text-muted-foreground">
                  {isAdmin ? "Nutricionista" : "Paciente"}
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild aria-label="Mi cuenta" className="rounded-full">
                <Link to="/account">
                  <UserCircle className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Cerrar sesión" className="rounded-full">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

        </div>
        <div className="md:hidden border-t border-border/60">
          <div className="mx-auto max-w-7xl px-4 flex gap-2 py-2 overflow-x-auto">
            {nav.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all " +
                    (active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground bg-card/60 border border-border/60")
                  }
                >

                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
