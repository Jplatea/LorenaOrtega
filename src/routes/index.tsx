import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Leaf,
  ArrowRight,
  Menu,
  X,
  Users,
  Stethoscope,
  Building2,
  BookOpen,
  NotebookPen,
  Activity,
  MessagesSquare,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  ChevronRight,
  Lock,
  LockOpen,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { createPatient } from "@/lib/patients.functions";
import { MEALS } from "@/lib/domain";
import { ensureIngredients } from "@/lib/recipes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lorena Ortega Dietética — Nutrición guiada por datos" },
      {
        name: "description",
        content:
          "Clínica de nutrición Lorena Ortega Dietética. Plan semanal, seguimiento con tu nutricionista y biblioteca de documentos en tu área privada.",
      },
      { property: "og:title", content: "Lorena Ortega Dietética — Nutrición guiada por datos" },
      {
        property: "og:description",
        content:
          "Plan semanal, seguimiento con tu nutricionista y biblioteca de documentos en tu área privada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Lorena Ortega Dietética — Nutrición guiada por datos" },
      {
        name: "twitter:description",
        content: "Plan semanal, seguimiento y documentos de tu clínica de nutrición, en un solo lugar.",
      },
    ],
  }),
  component: LandingPage,
});

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Servicios", href: "#servicios" },
  { label: "Recursos", href: "#recursos" },
  { label: "Contacto", href: "#contacto" },
];

const profiles = [
  {
    icon: Users,
    title: "Pacientes",
    text: "Consulta tu plan semanal, tus recetas y tus documentos desde cualquier dispositivo.",
  },
  {
    icon: Stethoscope,
    title: "Nutricionistas",
    text: "Crea dietas por días y comidas, reutiliza recetas y comparte informes en PDF.",
  },
  {
    icon: Building2,
    title: "Clínicas",
    text: "Gestiona todo el historial de pacientes con acceso seguro por roles y privacidad total.",
  },
];

const resources = [
  { icon: NotebookPen, title: "Recetario", text: "Recetas por comida, listas para asignar.", tone: "bg-primary/25" },
  { icon: BookOpen, title: "Guías", text: "Materiales de apoyo y educación alimentaria.", tone: "bg-secondary" },
  { icon: Activity, title: "Seguimiento", text: "Notas de consulta y objetivos revisados.", tone: "bg-accent/60" },
  { icon: MessagesSquare, title: "Comunidad", text: "Acompañamiento continuo entre visitas.", tone: "bg-muted" },
];

const meals = [
  { meal: "Desayuno", plan: "Avena con frutos rojos", kcal: "320" },
  { meal: "Media mañana", plan: "Yogur natural y nueces", kcal: "180" },
  { meal: "Almuerzo", plan: "Salmón, quinoa y verduras", kcal: "540" },
  { meal: "Merienda", plan: "Fruta de temporada", kcal: "120" },
  { meal: "Cena", plan: "Crema de calabaza y tortilla", kcal: "380" },
];

function LandingPage() {
  const [open, setOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authed, setAuthed] = useState(false);

  function openLogin() {
    setOpen(false);
    setShowLogin(true);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setAuthed(false);
    setShowLogin(false);
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* 1. Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 text-foreground backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/25">
                <Leaf className="h-4 w-4 text-primary" />
              </span>
              <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
                Lorena Ortega Dietética
              </span>
            </Link>

            <button
              type="button"
              onClick={authed ? handleSignOut : openLogin}
              aria-label={authed ? "Cerrar sesión" : "Acceder"}
              title={authed ? "Cerrar sesión" : "Acceder"}
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground shadow-[var(--shadow-soft)] transition hover:border-primary/40 hover:text-primary"
            >
              {authed ? <LockOpen className="h-[18px] w-[18px]" /> : <Lock className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Login in-page + panel de 3 tarjetas (sin cambiar de página) */}
      {(showLogin || authed) && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 flex items-start justify-center overflow-y-auto bg-background/95 px-4 py-12 backdrop-blur-xl duration-500 animate-in fade-in sm:items-center">
          {authed ? (
            <DashboardCards />
          ) : (
            <LoginCard onClose={() => setShowLogin(false)} onSuccess={() => setAuthed(true)} />
          )}
        </div>
      )}

      {/* 2. Hero */}
      <section
        id="inicio"
        className="hero-aurora relative z-[36] overflow-hidden text-foreground shadow-[0_34px_54px_-30px_rgba(42,54,59,0.22)]"
      >
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-36">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground shadow-[var(--shadow-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Nutrición clínica personalizada
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-7 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Tu Nutrición,
              <br />
              Guiada por Datos.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              Planes semanales, recetas y seguimiento profesional en un único espacio privado.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mx-auto mt-10 flex w-full max-w-xl flex-col gap-2 rounded-3xl border border-border bg-card p-2 shadow-[var(--shadow-float)] sm:flex-row sm:rounded-full sm:items-center"
            >
              <label htmlFor="hero-email" className="sr-only">
                Tu email
              </label>
              <input
                id="hero-email"
                type="email"
                placeholder="tucorreo@email.com"
                className="min-w-0 flex-1 rounded-full bg-transparent px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <Button type="submit" size="lg" className="shrink-0 sm:h-11">
                Reservar consulta <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </Reveal>
        </div>
      </section>

      {/* 3. Sección gradiente + mockup */}
      <section
        id="servicios"
        className="canvas-gradient relative z-[30] shadow-[0_34px_54px_-30px_rgba(42,54,59,0.22)]"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Seguimiento
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Seguimiento continuo con tu nutricionista
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Cada ajuste de tu plan queda registrado y disponible al instante en tu área privada.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-3xl border border-border/70 bg-card/70 p-7 shadow-[var(--shadow-soft)] backdrop-blur">
                <div className="flex flex-wrap gap-2">
                  {["Dieta", "Recetas", "Documentos"].map((t, i) => (
                    <span
                      key={t}
                      className={
                        "rounded-full px-4 py-1.5 text-xs font-medium " +
                        (i === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground")
                      }
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h3 className="mt-7 text-2xl font-semibold">Un plan que evoluciona contigo</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Tu nutricionista adapta cada comida a tus preferencias, tu rutina y tus objetivos.
                  Tú solo tienes que abrir la semana y seguirla.
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "Plan por días y comidas, siempre actualizado",
                    "Recetas ajustadas a tus cantidades",
                    "Documentos y analíticas en un solo lugar",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="h-full rounded-3xl bg-card p-6 shadow-[var(--shadow-float)] sm:p-8">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Semana 12</div>
                    <div className="truncate text-lg font-semibold">Plan de Ana G.</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary-foreground">
                    Activo
                  </span>
                </div>
                <div className="mt-6 overflow-hidden rounded-2xl border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-medium">Comida</th>
                        <th className="px-4 py-2 font-medium">Plan</th>
                        <th className="px-4 py-2 text-right font-medium">Kcal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meals.map((m) => (
                        <tr key={m.meal} className="border-t border-border/70">
                          <td className="px-4 py-3 font-medium">{m.meal}</td>
                          <td className="px-4 py-3 text-muted-foreground">{m.plan}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{m.kcal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. Plan en segundos */}
      <section className="relative z-[24] bg-background shadow-[0_34px_54px_-30px_rgba(42,54,59,0.22)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Automatización
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Tu plan en segundos
            </h2>
            <p className="mt-4 max-w-md text-base text-muted-foreground">
              La consulta se convierte en un plan claro, exportable a PDF y guardado automáticamente
              en tu biblioteca.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div
              className="relative overflow-hidden rounded-3xl border border-border p-6 text-foreground shadow-[var(--shadow-float)] sm:p-8"
              style={{
                background:
                  "linear-gradient(135deg," +
                  "rgba(153,184,152,0.13) 0%," + // #99B898 salvia
                  "rgba(254,206,168,0.10) 28%," + // #FECEA8 nude
                  "rgba(255,132,124,0.09) 52%," + // #FF847C coral
                  "rgba(232,74,95,0.07) 74%," + // #E84A5F rojo
                  "rgba(42,54,59,0.05) 100%)," + // #2A363B navy
                  "var(--card)",
              }}
            >
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-destructive/70" />
                <span className="h-3 w-3 rounded-full bg-secondary" />
                <span className="h-3 w-3 rounded-full bg-primary" />
              </div>
              <div className="relative z-10 mt-7 space-y-4 text-sm">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card px-4 py-3 text-muted-foreground shadow-[var(--shadow-elevated)]">
                  Quiero un plan de 5 comidas, sin lactosa, para entrenar por la tarde.
                </div>
                <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-card px-4 py-3 text-foreground shadow-[var(--shadow-elevated)]">
                  Plan semanal generado: 5 comidas al día, sin lactosa, con carbohidrato de calidad
                  en almuerzo y cena previa al entrenamiento.
                </div>
                <div className="rounded-2xl px-4 py-3 text-muted-foreground">
                  <div className="text-xs uppercase tracking-wider">Resumen</div>
                  <div className="mt-2 grid grid-cols-3 gap-3 text-center">
                    {[
                      ["1.540", "kcal"],
                      ["120 g", "proteína"],
                      ["7", "días"],
                    ].map(([v, l]) => (
                      <div key={l} className="rounded-xl bg-card px-2 py-3 shadow-[var(--shadow-elevated)]">
                        <div className="text-base font-semibold text-foreground">{v}</div>
                        <div className="text-[11px]">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. Perfiles */}
      <section className="relative z-[18] bg-surface shadow-[0_34px_54px_-30px_rgba(42,54,59,0.22)]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Soluciones para cada perfil
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Una misma plataforma, adaptada a quien la usa cada día.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p, i) => (
              <Reveal key={p.title} delay={i * 100} className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/25">
                  <p.icon className="h-6 w-6 text-primary-foreground" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{p.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Banner dividido */}
      <section className="bg-background px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20">
        <Reveal className="mx-auto max-w-7xl">
          <div className="grid overflow-hidden rounded-3xl shadow-[var(--shadow-float)] lg:grid-cols-2">
            <div
              className="relative flex min-h-[280px] items-center justify-center overflow-hidden p-10 text-foreground"
              style={{
                background:
                  "linear-gradient(140deg, rgba(153,184,152,0.30), rgba(254,206,168,0.22)), var(--card)",
              }}
            >
              <div className="relative z-10 text-center">
                <Leaf className="mx-auto h-9 w-9 text-primary" />
                <h3 className="mt-5 text-2xl font-bold sm:text-3xl">
                  Todo tu historial,
                  <br />
                  siempre contigo
                </h3>
                <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
                  Acceso privado y seguro a tus planes y documentos.
                </p>
              </div>
            </div>
            <div
              className="p-10 text-foreground"
              style={{ background: "linear-gradient(140deg, rgba(254,206,168,0.40), rgba(255,132,124,0.28)), var(--card)" }}
            >
              <h3 className="text-2xl font-bold sm:text-3xl">Incluido en tu área</h3>
              <ul className="mt-6 space-y-4 text-sm">
                {[
                  "Dieta semanal por días y comidas",
                  "Recetario con cantidades personalizadas",
                  "Exportación del plan a PDF profesional",
                  "Biblioteca privada de documentos",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <Button variant="ink" size="lg" className="mt-8" onClick={openLogin}>
                Entrar a mi área <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 7. Recursos */}
      <section id="recursos" className="bg-background">
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
          <Reveal className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Recursos, guías y herramientas
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Material práctico que acompaña tu plan entre consulta y consulta.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {resources.map((r, i) => (
              <Reveal key={r.title} delay={i * 80}>
                <div
                  className={`hover-lift flex h-full min-h-[220px] flex-col justify-between rounded-3xl p-6 ${r.tone}`}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-card/80">
                    <r.icon className="h-5 w-5 text-primary-foreground" />
                  </span>
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold">{r.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA final */}
      <section id="contacto" className="bg-background px-4 pb-20 sm:px-6 sm:pb-28">
        <Reveal className="mx-auto max-w-7xl">
          <div
            className="overflow-hidden rounded-3xl px-6 py-20 text-center text-white sm:py-24"
            style={{ background: "linear-gradient(140deg, #FF847C, #E84A5F)" }}
          >
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
              Empieza tu cambio hoy.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-white/85 sm:text-base">
              Reserva tu primera consulta y recibe tu acceso privado.
            </p>
            <Button size="lg" className="mt-9 bg-white text-foreground hover:bg-white/90" onClick={openLogin}>
              Acceder a mi cuenta <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Reveal>
      </section>

      {/* 9. Footer */}
      <footer className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/25">
                  <Leaf className="h-5 w-5 text-primary" />
                </span>
                <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Lorena Ortega Dietética
                </span>
              </div>
              <p className="mt-4 max-w-sm text-sm text-ink-muted">
                Nutrición clínica personalizada y seguimiento profesional.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <FooterCol
                title="Plataforma"
                items={[
                  { label: "Inicio", href: "#inicio" },
                  { label: "Servicios", href: "#servicios" },
                  { label: "Recursos", href: "#recursos" },
                ]}
              />
              <FooterCol
                title="Cuenta"
                items={[
                  { label: "Acceder", to: "/auth" },
                  { label: "Mi área", to: "/auth" },
                ]}
              />
              <FooterCol
                title="Clínica"
                items={[
                  { label: "Contacto", href: "#contacto" },
                  { label: "Privacidad", href: "#contacto" },
                ]}
              />
            </div>
          </div>
          <div className="mt-12 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-ink-muted/20 pt-6 text-xs text-ink-muted">
            <span className="truncate">
              © {new Date().getFullYear()} Lorena Ortega Dietética
            </span>
            <Link to="/setup" className="shrink-0 opacity-40 transition-opacity hover:opacity-100">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LoadingBar() {
  return (
    <span className="relative block h-1.5 w-14 overflow-hidden rounded-full bg-current/25" aria-hidden>
      <span className="absolute inset-0 origin-left rounded-full bg-current animate-[loadfill_1s_ease-in-out_infinite]" />
    </span>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href?: string; to?: string }[];
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider">{title}</div>
      <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
        {items.map((i) => (
          <li key={i.label}>
            {i.to ? (
              <Link to={i.to} className="transition-colors hover:text-ink-foreground">
                {i.label}
              </Link>
            ) : (
              <a href={i.href} className="transition-colors hover:text-ink-foreground">
                {i.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoginCard({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("No se ha podido iniciar sesión", { description: error.message });
      return;
    }
    if (data.user) {
      supabase
        .from("profiles")
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq("id", data.user.id)
        .then(() => {});
    }
    onSuccess();
  }

  return (
    <div
      className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border p-8 shadow-[var(--shadow-float)] duration-500 animate-in fade-in zoom-in-95"
      style={{
        background:
          "linear-gradient(135deg," +
          "rgba(153,184,152,0.13) 0%," +
          "rgba(254,206,168,0.10) 28%," +
          "rgba(255,132,124,0.09) 52%," +
          "rgba(232,74,95,0.07) 74%," +
          "rgba(42,54,59,0.05) 100%)," +
          "var(--card)",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-card text-muted-foreground shadow-[var(--shadow-elevated)] transition hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 text-primary">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/25">
          <Leaf className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-foreground">Lorena Ortega Dietética</span>
      </div>

      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">Iniciar sesión</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Accede con las credenciales que te ha facilitado tu nutricionista.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Usuario / correo</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="bg-card shadow-[var(--shadow-elevated)]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Contraseña</Label>
          <div className="relative">
            <Input
              id="login-password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-card pr-10 shadow-[var(--shadow-elevated)]"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <LoadingBar /> : "Iniciar sesión"}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        ¿Problemas para acceder? Contacta con tu nutricionista.
      </p>
    </div>
  );
}

const DEFAULT_CARD_BG =
  "linear-gradient(135deg," +
  "rgba(153,184,152,0.13) 0%," +
  "rgba(254,206,168,0.10) 28%," +
  "rgba(255,132,124,0.09) 52%," +
  "rgba(232,74,95,0.07) 74%," +
  "rgba(42,54,59,0.05) 100%)," +
  "var(--card)";

type DashCard = {
  label: string;
  desc: string;
  icon: typeof Users;
  bg: string;
};

const DASH_CARDS: DashCard[] = [
  { label: "Clientes", desc: "Tus pacientes y sus fichas.", icon: Users, bg: "linear-gradient(150deg, #D3E2D1, #E7F0E6)" },
  { label: "Dietas", desc: "Planes semanales por paciente.", icon: NotebookPen, bg: "linear-gradient(150deg, #F6B1AC, #FBD5D2)" },
  { label: "Recetas", desc: "Recetario por tipo de comida.", icon: BookOpen, bg: "linear-gradient(150deg, #FBD3AC, #FEE8D2)" },
  { label: "Recursos", desc: "Guías y materiales de apoyo.", icon: Activity, bg: "linear-gradient(150deg, #E6E4E1, #F1EFEC)" },
];

function DashboardCards() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="w-full max-w-6xl duration-500 animate-in fade-in zoom-in-95">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">¿Qué quieres gestionar?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Elige una sección para empezar.</p>
      </div>

      <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-stretch">
        {DASH_CARDS.map((c) => {
          const isOpen = expanded === c.label;
          const isCollapsed = expanded !== null && !isOpen;
          return (
            <div
              key={c.label}
              className={cn(
                "relative overflow-hidden rounded-3xl border border-black/5 shadow-[var(--shadow-float)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                isOpen ? "md:flex-[7]" : isCollapsed ? "md:flex-[0.5]" : "md:flex-1",
              )}
              style={{ background: c.bg }}
            >
              {isOpen ? (
                <ExpandedCard card={c} onClose={() => setExpanded(null)} />
              ) : (
                <button
                  type="button"
                  onClick={() => setExpanded(c.label)}
                  className="group flex h-full min-h-[220px] w-full flex-col items-start p-7 text-left"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-card text-foreground shadow-[var(--shadow-elevated)]">
                    <c.icon className="h-5 w-5" />
                  </span>
                  {isCollapsed ? (
                    <span className="mt-4 hidden text-xs font-medium text-foreground [writing-mode:vertical-rl] md:inline">
                      {c.label}
                    </span>
                  ) : (
                    <>
                      <h3 className="mt-5 text-xl font-semibold text-foreground">{c.label}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                      <ArrowRight className="mt-auto pt-6 h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExpandedCard({ card, onClose }: { card: DashCard; onClose: () => void }) {
  return (
    <div className="flex h-full min-h-[360px] flex-col p-7 duration-500 animate-in fade-in slide-in-from-bottom-2 sm:p-9">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-card text-foreground shadow-[var(--shadow-elevated)]">
            <card.icon className="h-5 w-5" />
          </span>
          <h3 className="text-xl font-semibold text-foreground">{card.label}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="grid h-9 w-9 place-items-center rounded-full bg-card text-muted-foreground shadow-[var(--shadow-elevated)] transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 flex-1">
        {card.label === "Clientes" ? (
          <ClientesPanel />
        ) : card.label === "Recetas" ? (
          <RecetasPanel />
        ) : (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              Aquí tendrás <span className="font-medium text-foreground">{card.label}</span>. Lo dejamos listo en la próxima iteración.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

type RecipeItem = {
  id: string;
  meal: string;
  title: string;
  content: string;
  ingredients: { name: string; amount: string }[];
};

function splitAmount(a: string): { amount: string; unit: string } {
  const t = (a ?? "").trim();
  const parts = t.split(/\s+/);
  const last = (parts[parts.length - 1] ?? "").toLowerCase();
  if (parts.length > 1 && (last === "gr" || last === "ml" || last === "porción" || last === "porcion")) {
    return { amount: parts.slice(0, -1).join(" "), unit: last === "porcion" ? "porción" : last };
  }
  return { amount: t, unit: "gr" };
}

function RecetasPanel() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<"new" | RecipeItem | null>(null);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recetas-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("id, meal, title, content, ingredients")
        .order("title");
      return (data ?? []).map((r) => ({ ...r, ingredients: ensureIngredients(r.ingredients) })) as RecipeItem[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["recetas-list"] });

  if (editing) {
    return (
      <RecipeEditor
        recipe={editing === "new" ? null : editing}
        titles={[...new Set((recipes ?? []).map((r) => r.title))]}
        onBack={() => setEditing(null)}
        onSaved={() => {
          refresh();
          setEditing(null);
        }}
      />
    );
  }

  async function duplicate(r: RecipeItem) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("recipes").insert({
      meal: r.meal,
      title: `${r.title} (copia)`,
      content: r.content,
      ingredients: r.ingredients,
      created_by: u.user?.id ?? null,
    } as never);
    if (error) {
      toast.error("No se pudo duplicar", { description: error.message });
      return;
    }
    toast.success("Receta duplicada");
    refresh();
  }

  async function remove(r: RecipeItem) {
    const { error } = await supabase.from("recipes").delete().eq("id", r.id);
    if (error) {
      toast.error("No se pudo eliminar", { description: error.message });
      return;
    }
    toast.success("Receta eliminada");
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {isLoading ? "Cargando…" : `${recipes?.length ?? 0} recetas`}
        </span>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Nueva receta
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elevated)]">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
        ) : recipes && recipes.length > 0 ? (
          <ul className="divide-y divide-border">
            {recipes.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{r.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {MEALS.find((m) => m.id === r.meal)?.label ?? r.meal}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(r)}
                    aria-label="Editar"
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicate(r)}
                    aria-label="Duplicar"
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r)}
                    aria-label="Eliminar"
                    className="grid h-8 w-8 place-items-center rounded-lg text-destructive transition hover:opacity-80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aún no hay recetas. Pulsa “Nueva receta” para crear la primera.
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeEditor({
  recipe,
  titles,
  onBack,
  onSaved,
}: {
  recipe: RecipeItem | null;
  titles: string[];
  onBack: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [meal, setMeal] = useState(recipe?.meal ?? "almuerzo");
  const [ingredients, setIngredients] = useState<{ name: string; amount: string; unit: string }[]>(
    recipe && recipe.ingredients.length > 0
      ? recipe.ingredients.map((i) => ({ name: i.name, ...splitAmount(i.amount) }))
      : [{ name: "", amount: "", unit: "gr" }],
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = {
      meal,
      title: title.trim(),
      content: "",
      ingredients: ingredients
        .filter((i) => i.name.trim() || i.amount.trim())
        .map((i) => ({
          name: i.name.trim(),
          amount: [i.amount.trim(), i.amount.trim() ? i.unit : ""].filter(Boolean).join(" "),
        })),
    };
    let error;
    if (recipe) {
      ({ error } = await supabase.from("recipes").update(payload as never).eq("id", recipe.id));
    } else {
      ({ error } = await supabase.from("recipes").insert({ ...payload, created_by: u.user?.id ?? null } as never));
    }
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar", { description: error.message });
      return;
    }
    toast.success(recipe ? "Receta actualizada ✓" : "Receta guardada ✓");
    onSaved();
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4 rotate-180" /> Volver a las recetas
      </button>

      <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
        <div className="space-y-2">
          <Label htmlFor="rec-title">Título</Label>
          <Input
            id="rec-title"
            list="recetas-titulos"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Tostadas de aguacate"
            autoComplete="off"
            className="bg-card shadow-[var(--shadow-elevated)]"
          />
          <datalist id="recetas-titulos">
            {titles.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <Label>Comida</Label>
          <Select value={meal} onValueChange={setMeal}>
            <SelectTrigger className="w-full bg-card shadow-[var(--shadow-elevated)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEALS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.emoji} {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Ingredientes / cantidades</Label>
        {ingredients.map((ing, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={ing.name}
              onChange={(e) => setIngredients((p) => p.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
              placeholder="Ingrediente o paso"
              className="flex-1 bg-card shadow-[var(--shadow-elevated)]"
            />
            <Input
              value={ing.amount}
              onChange={(e) => setIngredients((p) => p.map((x, idx) => (idx === i ? { ...x, amount: e.target.value } : x)))}
              placeholder="200"
              inputMode="numeric"
              className="w-16 shrink-0 bg-card shadow-[var(--shadow-elevated)] sm:w-24"
            />
            <Select value={ing.unit} onValueChange={(v) => setIngredients((p) => p.map((x, idx) => (idx === i ? { ...x, unit: v } : x)))}>
              <SelectTrigger className="w-[88px] shrink-0 bg-card shadow-[var(--shadow-elevated)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gr">gr</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="porción">porción</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => setIngredients((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p))}
              disabled={ingredients.length <= 1}
              aria-label="Quitar línea"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-destructive transition disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setIngredients((p) => [...p, { name: "", amount: "", unit: "gr" }])}>
          <Plus className="h-4 w-4" /> Añadir línea
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" type="button" onClick={onBack} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <LoadingBar />
          ) : (
            <>
              <Plus className="h-4 w-4" /> {recipe ? "Guardar cambios" : "Guardar receta"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ClientesPanel() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"list" | "new">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clientes-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (selectedId) {
    return (
      <ClientDetail
        id={selectedId}
        onBack={() => setSelectedId(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["clientes-list"] })}
      />
    );
  }

  if (mode === "new") {
    return (
      <NewClientForm
        onCancel={() => setMode("list")}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["clientes-list"] });
          setMode("list");
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {isLoading ? "Cargando…" : `${clients?.length ?? 0} clientes`}
        </span>
        <Button size="sm" onClick={() => setMode("new")}>
          <Plus className="h-4 w-4" /> Nuevo cliente
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elevated)]">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
        ) : clients && clients.length > 0 ? (
          <ul className="divide-y divide-border">
            {clients.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/50"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-medium text-foreground">
                    {(c.first_name?.[0] ?? "") + (c.last_name?.[0] ?? "")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {c.first_name} {c.last_name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aún no tienes clientes. Pulsa “Nuevo cliente” para crear el primero.
          </div>
        )}
      </div>
    </div>
  );
}

function genClientPassword(len = 12) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += abc[bytes[i] % abc.length];
  return out;
}

function ClientField({
  label,
  name,
  type = "text",
  required,
  step,
  className,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  step?: string;
  className?: string;
  defaultValue?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={`cli-${name}`}>{label}</Label>
      <Input
        id={`cli-${name}`}
        name={name}
        type={type}
        required={required}
        step={step}
        defaultValue={defaultValue}
        className="bg-card shadow-[var(--shadow-elevated)]"
      />
    </div>
  );
}

function NewClientForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const create = useServerFn(createPatient);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<{ tempPassword: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email") || "").trim(),
      password: password.trim() || null,
      first_name: String(fd.get("first_name") || "").trim(),
      last_name: String(fd.get("last_name") || "").trim(),
      phone: (fd.get("phone") as string) || null,
      dni: (fd.get("dni") as string) || null,
      address: (fd.get("address") as string) || null,
      birth_date: (fd.get("birth_date") as string) || null,
      sex: (fd.get("sex") as "male" | "female" | "other") || null,
      height: fd.get("height") ? Number(fd.get("height")) : null,
      observations: (fd.get("observations") as string) || null,
    };
    if (payload.password && payload.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await create({ data: payload });
      setResult({ tempPassword: res.tempPassword });
      toast.success("Cliente creado");
    } catch (err) {
      toast.error("No se pudo crear", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-elevated)]">
          <h4 className="font-semibold text-foreground">Cliente creado ✅</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Comparte esta contraseña temporal con el cliente (se le pedirá cambiarla al entrar).
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
            <span className="font-mono text-lg text-foreground">{result.tempPassword}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(result.tempPassword);
                toast.success("Copiado");
              }}
            >
              <Copy className="h-4 w-4" /> Copiar
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setResult(null)}>
            Crear otro
          </Button>
          <Button onClick={onCreated}>Ver lista</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <ClientField label="Nombre" name="first_name" required />
        <ClientField label="Apellidos" name="last_name" required />
        <ClientField label="Email" name="email" type="email" required className="sm:col-span-2" />
        <ClientField label="Teléfono" name="phone" />
        <ClientField label="DNI" name="dni" />
        <ClientField label="Dirección" name="address" className="sm:col-span-2" />
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cli-pass">Contraseña de acceso</Label>
          <div className="flex gap-2">
            <Input
              id="cli-pass"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres (opcional)"
              className="bg-card shadow-[var(--shadow-elevated)]"
            />
            <Button type="button" variant="outline" onClick={() => setPassword(genClientPassword(12))}>
              <RefreshCw className="h-4 w-4" /> Generar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Si la dejas vacía, se genera una temporal automáticamente.</p>
        </div>
        <ClientField label="Fecha de nacimiento" name="birth_date" type="date" />
        <div className="space-y-2">
          <Label>Sexo</Label>
          <Select name="sex">
            <SelectTrigger className="w-full bg-card shadow-[var(--shadow-elevated)]">
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Mujer</SelectItem>
              <SelectItem value="male">Hombre</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ClientField label="Altura (cm)" name="height" type="number" step="0.1" />
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cli-observations">Observaciones</Label>
          <Textarea id="cli-observations" name="observations" rows={3} className="bg-card shadow-[var(--shadow-elevated)]" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <LoadingBar />
          ) : (
            <>
              <Plus className="h-4 w-4" /> Crear cliente
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function ClientDetail({ id, onBack, onSaved }: { id: string; onBack: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const { data: p, isLoading } = useQuery({
    queryKey: ["cliente-detalle", id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const sexValue = String(fd.get("sex") || "");
    const payload = {
      first_name: String(fd.get("first_name") || ""),
      last_name: String(fd.get("last_name") || ""),
      phone: (fd.get("phone") as string) || null,
      dni: (fd.get("dni") as string) || null,
      address: (fd.get("address") as string) || null,
      birth_date: (fd.get("birth_date") as string) || null,
      sex: sexValue === "none" || sexValue === "" ? null : sexValue,
      height: fd.get("height") ? Number(fd.get("height")) : null,
      observations: (fd.get("observations") as string) || null,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar", { description: error.message });
      return;
    }
    toast.success("Ficha actualizada ✓");
    onSaved();
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4 rotate-180" /> Volver a la lista
      </button>

      {isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
      ) : !p ? (
        <div className="p-6 text-sm text-muted-foreground">Cliente no encontrado.</div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft text-base font-medium text-foreground">
              {(p.first_name?.[0] ?? "") + (p.last_name?.[0] ?? "")}
            </span>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-foreground">
                {p.first_name} {p.last_name}
              </div>
              <div className="truncate text-sm text-muted-foreground">{p.email}</div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <ClientField label="Nombre" name="first_name" defaultValue={p.first_name ?? ""} required />
            <ClientField label="Apellidos" name="last_name" defaultValue={p.last_name ?? ""} required />
            <ClientField label="Teléfono" name="phone" defaultValue={p.phone ?? ""} />
            <ClientField label="DNI" name="dni" defaultValue={p.dni ?? ""} />
            <ClientField label="Dirección" name="address" defaultValue={p.address ?? ""} className="sm:col-span-2" />
            <ClientField label="Fecha de nacimiento" name="birth_date" type="date" defaultValue={p.birth_date ?? ""} />
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select name="sex" defaultValue={p.sex ?? "none"}>
                <SelectTrigger className="w-full bg-card shadow-[var(--shadow-elevated)]">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="female">Mujer</SelectItem>
                  <SelectItem value="male">Hombre</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ClientField
              label="Altura (cm)"
              name="height"
              type="number"
              step="0.1"
              defaultValue={p.height != null ? String(p.height) : ""}
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cli-detail-observations">Observaciones</Label>
              <Textarea
                id="cli-detail-observations"
                name="observations"
                rows={3}
                defaultValue={p.observations ?? ""}
                className="bg-card shadow-[var(--shadow-elevated)]"
              />
            </div>
            <div className="flex justify-end pt-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? <LoadingBar /> : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
