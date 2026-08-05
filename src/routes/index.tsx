import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  Upload,
  Link as LinkIcon,
  FileText,
  Save,
  Download,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Send,
  Inbox,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
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
import { MEALS, DAYS } from "@/lib/domain";
import { ensureIngredients, renderIngredients } from "@/lib/recipes";
import { parseMeal, serializeMeal, type MealValue } from "@/lib/meal-options";
import { buildDietPdf, type DietRow } from "@/lib/pdf-export";
import BEDCA_FOODS from "@/data/bedca-foods.json";
import { RecipeCombobox } from "@/components/recipe-combobox";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      // Solo mantenemos la sesión si el usuario marcó "ordenador personal".
      if (localStorage.getItem("lo-persist") === "1") setAuthed(true);
      else supabase.auth.signOut();
    });
  }, []);

  // Con el overlay abierto, bloqueamos el scroll de la página de fondo para
  // que no aparezca su barra de scroll (el segundo scrollbar "fantasma").
  useEffect(() => {
    const openOverlay = showLogin || authed;
    const prev = document.body.style.overflow;
    if (openOverlay) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showLogin, authed]);

  function openLogin() {
    setOpen(false);
    setShowLogin(true);
  }

  async function handleSignOut() {
    localStorage.removeItem("lo-persist");
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
        <div
          id="lo-overlay"
          className="fixed inset-x-0 bottom-0 top-16 z-40 flex items-start justify-center overflow-y-auto bg-background/95 px-4 py-12 backdrop-blur-xl duration-500 animate-in fade-in"
        >
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
            <div className="mt-10">
              <Button
                size="lg"
                onClick={() => document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                Reservar consulta <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
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
      {/* 8b. Contacto */}
      <ContactoSection />

      <section className="bg-background px-4 pb-20 sm:px-6 sm:pb-28">
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
                  { label: "Aviso legal", to: "/aviso-legal" },
                  { label: "Privacidad", to: "/privacidad" },
                  { label: "Cookies", to: "/cookies" },
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
  const [trust, setTrust] = useState(true);

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
    if (trust) localStorage.setItem("lo-persist", "1");
    else localStorage.removeItem("lo-persist");
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
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={trust}
            onChange={(e) => setTrust(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span>
            Este es mi <span className="font-medium text-foreground">ordenador personal</span> — mantener la sesión iniciada.
          </span>
        </label>
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
  { label: "Dietas", desc: "Planes semanales por paciente.", icon: NotebookPen, bg: "linear-gradient(150deg, #E6E4E1, #F1EFEC)" },
  { label: "Recetas", desc: "Recetario por tipo de comida.", icon: BookOpen, bg: "linear-gradient(150deg, #FBD3AC, #FEE8D2)" },
  { label: "Recursos", desc: "Guías y materiales de apoyo.", icon: Activity, bg: "linear-gradient(150deg, #C6D3D8, #E4ECEF)" },
  { label: "Solicitudes", desc: "Reservas y mensajes recibidos.", icon: Inbox, bg: "linear-gradient(150deg, #F7C6C1, #FCE3E0)" },
];

// Datos de contacto — EDITA estos valores con los reales de la clínica.
const CONTACT = {
  whatsapp: "34600000000", // número con prefijo de país, sin "+" ni espacios
  phone: "+34 600 00 00 00",
  email: "hola@lorenaortega.es",
  location: "Consulta presencial y online",
};

function ContactMethod({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const cls =
    "flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-elevated)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]";
  const body = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="block truncate text-sm font-semibold text-foreground">{value}</span>
      </span>
    </>
  );
  return href ? (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={cls}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const set = (k: "name" | "email" | "message") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) return;
    setStatus("loading");
    const { error } = await supabase.from("leads").insert({
      name: form.name.trim() || null,
      email: form.email.trim(),
      message: form.message.trim() || null,
      source: "contacto",
    });
    if (error) {
      setStatus("idle");
      toast.error("No se pudo enviar", { description: "Inténtalo de nuevo en un momento." });
      return;
    }
    setStatus("done");
  }
  if (status === "done") {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-primary/30 bg-primary-soft/50 p-8 text-center shadow-[var(--shadow-float)]">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-6 w-6" />
        </span>
        <p className="text-base font-semibold text-foreground">¡Mensaje enviado!</p>
        <p className="max-w-xs text-sm text-muted-foreground">Gracias por escribir. Te responderé lo antes posible.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-float)] sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Nombre</Label>
          <Input id="c-name" value={form.name} onChange={set("name")} placeholder="Tu nombre" className="bg-card shadow-[var(--shadow-soft)]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-email">Email</Label>
          <Input id="c-email" type="email" required value={form.email} onChange={set("email")} placeholder="tucorreo@email.com" className="bg-card shadow-[var(--shadow-soft)]" />
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        <Label htmlFor="c-msg">Cuéntame tu objetivo</Label>
        <Textarea id="c-msg" value={form.message} onChange={set("message")} placeholder="Qué te gustaría conseguir, disponibilidad…" rows={4} className="bg-card shadow-[var(--shadow-soft)]" />
      </div>
      <Button type="submit" size="lg" disabled={status === "loading"} className="mt-5 w-full sm:w-auto">
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4" /> Enviar solicitud
          </>
        )}
      </Button>
    </form>
  );
}

function ContactoSection() {
  const waLink = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    "Hola, me gustaría reservar una consulta de nutrición.",
  )}`;
  return (
    <section id="contacto" className="bg-background px-4 py-20 sm:px-6 sm:py-28">
      <Reveal className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Contacto</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Hablemos de tu objetivo</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Escríbeme y te propongo el mejor punto de partida, sin compromiso.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-3">
            <ContactMethod icon={MessageCircle} label="WhatsApp" value="Escríbeme por WhatsApp" href={waLink} external />
            <ContactMethod icon={Mail} label="Email" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
            <ContactMethod icon={Phone} label="Teléfono" value={CONTACT.phone} href={`tel:${CONTACT.phone.replace(/\s+/g, "")}`} />
            <ContactMethod icon={MapPin} label="Ubicación" value={CONTACT.location} />
          </div>
          <ContactForm />
        </div>
      </Reveal>
    </section>
  );
}

function SolicitudesPanel() {
  const qc = useQueryClient();
  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, name, email, phone, message, source, handled, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["leads-list"] });
    qc.invalidateQueries({ queryKey: ["leads-pending-count"] });
  };
  async function toggleHandled(id: string, handled: boolean) {
    await supabase.from("leads").update({ handled: !handled }).eq("id", id);
    invalidate();
  }
  async function remove(id: string) {
    await supabase.from("leads").delete().eq("id", id);
    invalidate();
  }
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {isLoading ? "Cargando…" : `${leads?.length ?? 0} solicitudes`}
      </p>
      {isLoading ? null : leads && leads.length > 0 ? (
        <ul className="space-y-3">
          {leads.map((l) => (
            <li
              key={l.id}
              className={cn(
                "rounded-2xl bg-card p-4 shadow-[var(--shadow-elevated)]",
                !l.handled && "ring-1 ring-primary/30",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{l.name || "Sin nombre"}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {l.source}
                    </span>
                    {!l.handled && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Nueva
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <a href={`mailto:${l.email}`} className="hover:text-primary">
                      {l.email}
                    </a>
                    {l.phone && (
                      <a href={`tel:${l.phone}`} className="hover:text-primary">
                        {l.phone}
                      </a>
                    )}
                    <span>{fmtDate(l.created_at)}</span>
                  </div>
                  {l.message && <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{l.message}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    variant={l.handled ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleHandled(l.id, l.handled)}
                  >
                    {l.handled ? (
                      "Reabrir"
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Atendida
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-destructive"
                    onClick={() => remove(l.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-[var(--shadow-elevated)]">
          Aún no hay solicitudes. Las reservas y mensajes de la web aparecerán aquí.
        </div>
      )}
    </div>
  );
}

type PeekTable = "profiles" | "recipes" | "diets" | "resources" | "leads";
const PEEK_TABLE: Record<string, PeekTable> = {
  Clientes: "profiles",
  Recetas: "recipes",
  Dietas: "diets",
  Recursos: "resources",
  Solicitudes: "leads",
};

// Solo las columnas con datos introducidos por el usuario (se ocultan id,
// fechas de sistema, claves foráneas y rutas internas de gestión).
const PEEK_COLUMNS: Record<PeekTable, string[]> = {
  profiles: [
    "first_name",
    "last_name",
    "email",
    "phone",
    "dni",
    "birth_date",
    "sex",
    "height",
    "address",
    "observations",
    "is_active",
  ],
  recipes: ["meal", "title", "content", "ingredients"],
  diets: ["week_number", "day_of_week", "meal", "content"],
  resources: ["kind", "title", "url", "mime_type", "size_bytes"],
  leads: ["name", "email", "phone", "message", "source", "handled", "created_at"],
};

const COLUMN_LABELS: Record<string, string> = {
  first_name: "Nombre",
  last_name: "Apellidos",
  email: "Email",
  phone: "Teléfono",
  dni: "DNI",
  birth_date: "Fecha nac.",
  sex: "Sexo",
  height: "Altura",
  address: "Dirección",
  observations: "Observaciones",
  is_active: "Activo",
  meal: "Comida",
  title: "Título",
  content: "Contenido",
  ingredients: "Ingredientes",
  week_number: "Semana",
  day_of_week: "Día",
  kind: "Tipo",
  url: "Enlace",
  mime_type: "Tipo de archivo",
  size_bytes: "Tamaño",
  message: "Mensaje",
  source: "Origen",
  handled: "Atendido",
  created_at: "Fecha",
};

function DashboardCards() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [peek, setPeek] = useState<string | null>(null);
  const closeCard = () => {
    setExpanded(null);
    setFullscreen(false);
  };
  // Con una tarjeta abierta, el overlay de fondo no scrollea (evita el
  // segundo scrollbar "fantasma"); solo scrollea el contenido de la tarjeta.
  useEffect(() => {
    const ov = document.getElementById("lo-overlay");
    if (!ov) return;
    ov.style.overflowY = expanded ? "hidden" : "";
    return () => {
      ov.style.overflowY = "";
    };
  }, [expanded]);
  const { data: pendingLeads } = useQuery({
    queryKey: ["leads-pending-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("handled", false);
      return count ?? 0;
    },
  });

  return (
    <div className="w-full max-w-6xl duration-500 animate-in fade-in zoom-in-95">
      {expanded === null && (
        <div className="text-center duration-300 animate-in fade-in">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">¿Qué quieres gestionar?</h2>
          <p className="mt-2 text-sm text-muted-foreground">Elige una sección para empezar.</p>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-4 md:flex-row md:items-stretch",
          expanded === null ? "mt-10" : "mt-0",
        )}
      >
        {DASH_CARDS.map((c) => {
          const isOpen = expanded === c.label;
          const isCollapsed = expanded !== null && !isOpen;
          return (
            <div
              key={c.label}
              className={cn(
                "relative overflow-hidden border border-black/5 shadow-[var(--shadow-float)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                isOpen && fullscreen
                  ? "fixed inset-0 z-[55] rounded-none border-0"
                  : cn("rounded-3xl", isOpen ? "md:flex-[7]" : isCollapsed ? "md:flex-[0.5]" : "md:flex-1"),
              )}
              style={{ background: c.bg }}
            >
              {isOpen ? (
                <ExpandedCard
                  card={c}
                  onClose={closeCard}
                  fullscreen={fullscreen}
                  onToggleFullscreen={() => setFullscreen((v) => !v)}
                />
              ) : (
                <div className="relative h-full">
                  <button
                    type="button"
                    onClick={() => setExpanded(c.label)}
                    className="group flex h-full min-h-[220px] w-full flex-col items-start p-7 text-left"
                  >
                    <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-card text-foreground shadow-[var(--shadow-elevated)]">
                      <c.icon className="h-5 w-5" />
                      {c.label === "Solicitudes" && (pendingLeads ?? 0) > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#E84A5F] px-1 text-[10px] font-bold text-white shadow-[var(--shadow-soft)]">
                          {pendingLeads}
                        </span>
                      )}
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
                  {!isCollapsed && (
                    <button
                      type="button"
                      onClick={() => setPeek(c.label)}
                      aria-label={`Ver base de datos de ${c.label}`}
                      title={`Ver base de datos completa de ${c.label}`}
                      className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-card/80 text-muted-foreground shadow-[var(--shadow-soft)] backdrop-blur transition hover:text-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {peek && <DataPeekModal label={peek} table={PEEK_TABLE[peek]} onClose={() => setPeek(null)} />}
    </div>
  );
}

function fmtCell(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) {
    const parts = v.map((it) =>
      it && typeof it === "object" && "name" in (it as object)
        ? [(it as { name?: string }).name, (it as { amount?: string }).amount].filter(Boolean).join(" ")
        : String(it),
    );
    return parts.join(", ") || "—";
  }
  if (typeof v === "object") return JSON.stringify(v);
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

function DataPeekModal({ label, table, onClose }: { label: string; table: PeekTable; onClose: () => void }) {
  const columns = PEEK_COLUMNS[table];
  const { data: rows, isLoading } = useQuery({
    queryKey: ["peek", table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select(columns.join(", ")).limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 duration-200 animate-in fade-in">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-float)] duration-300 animate-in zoom-in-95">
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground">{label} — base de datos</h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Cargando…" : `${rows?.length ?? 0} registros · ${columns.length} columnas`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card text-muted-foreground shadow-[var(--shadow-elevated)] transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Cargando…</div>
          ) : rows && rows.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                      {COLUMN_LABELS[c] ?? c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/40">
                    {columns.map((c) => (
                      <td key={c} className="max-w-[22rem] truncate px-3 py-2 align-top text-foreground" title={fmtCell(r[c])}>
                        {fmtCell(r[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No hay registros en esta tabla.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExpandedCard({
  card,
  onClose,
  fullscreen,
  onToggleFullscreen,
}: {
  card: DashCard;
  onClose: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[360px] flex-col p-7 duration-500 animate-in fade-in slide-in-from-bottom-2 sm:p-9",
        fullscreen ? "max-h-none" : "max-h-[76vh]",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-card text-foreground shadow-[var(--shadow-elevated)]">
            <card.icon className="h-5 w-5" />
          </span>
          <h3 className="text-xl font-semibold text-foreground">{card.label}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={fullscreen ? "Ventana normal" : "Expandir a pantalla completa"}
            title={fullscreen ? "Ventana normal" : "Expandir a pantalla completa"}
            className="grid h-9 w-9 place-items-center rounded-full bg-card text-muted-foreground shadow-[var(--shadow-elevated)] transition hover:text-foreground"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-full bg-card text-muted-foreground shadow-[var(--shadow-elevated)] transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
        {card.label === "Clientes" ? (
          <ClientesPanel />
        ) : card.label === "Recetas" ? (
          <RecetasPanel />
        ) : card.label === "Dietas" ? (
          <DietasPanel fullscreen={fullscreen} />
        ) : card.label === "Recursos" ? (
          <RecursosPanel />
        ) : card.label === "Solicitudes" ? (
          <SolicitudesPanel />
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
  image_path: string | null;
};

/** URL pública de la imagen de una receta (bucket público 'recipe-images'). */
function recipeImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from("recipe-images").getPublicUrl(path).data.publicUrl;
}

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
        .select("id, meal, title, content, ingredients, image_path")
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
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary-soft text-foreground">
                  {recipeImageUrl(r.image_path) ? (
                    <img src={recipeImageUrl(r.image_path) ?? ""} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <BookOpen className="h-4 w-4" />
                  )}
                </span>
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
  const [imagePath, setImagePath] = useState<string | null>(recipe?.image_path ?? null);
  const [imgUploading, setImgUploading] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  async function uploadImage(file: File) {
    setImgUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("recipe-images")
      .upload(path, file, { contentType: file.type || undefined });
    setImgUploading(false);
    if (error) {
      toast.error("No se pudo subir la imagen", { description: error.message });
      return;
    }
    if (imagePath) supabase.storage.from("recipe-images").remove([imagePath]);
    setImagePath(path);
  }
  async function removeImage() {
    if (imagePath) await supabase.storage.from("recipe-images").remove([imagePath]);
    setImagePath(null);
  }

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
      image_path: imagePath,
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
        <Label>Imagen (opcional)</Label>
        <div className="flex items-center gap-3">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-secondary/40">
            {imagePath ? (
              <img src={recipeImageUrl(imagePath) ?? ""} alt="" className="h-full w-full object-cover" />
            ) : (
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImage(f);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={imgUploading} onClick={() => imgRef.current?.click()}>
              {imgUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {imagePath ? "Cambiar" : "Subir imagen"}
            </Button>
            {imagePath && (
              <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={removeImage}>
                Quitar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <Label>Ingredientes / cantidades</Label>
          <span className="text-[11px] text-muted-foreground">
            Autocompletado con la base de datos española de alimentos{" "}
            <a href="https://www.bedca.net/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              BEDCA
            </a>
          </span>
        </div>
        {/* Lista de alimentos BEDCA (una sola vez, compartida por todos los campos) */}
        <datalist id="bedca-foods">
          {BEDCA_FOODS.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
        {ingredients.map((ing, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={ing.name}
              onChange={(e) => setIngredients((p) => p.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
              placeholder="Ingrediente o paso"
              list="bedca-foods"
              autoComplete="off"
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

type ResourceItem = {
  id: string;
  kind: "file" | "url";
  title: string;
  url: string | null;
  file_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  category: string;
};

const RESOURCE_CATEGORIES = ["Guías", "Analíticas", "Plantillas", "Educación", "Otros"] as const;

function RecursosPanel() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [addingUrl, setAddingUrl] = useState(false);
  const [urlTitle, setUrlTitle] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("Todas");
  const [preview, setPreview] = useState<{ title: string; url: string; mime: string | null } | null>(null);

  const newCat = () => (activeCat === "Todas" ? "Otros" : activeCat);
  const table = () => supabase.from("resources");

  const { data: resources, isLoading } = useQuery({
    queryKey: ["recursos-list"],
    queryFn: async () => {
      const { data } = await table()
        .select("id, kind, title, url, file_path, mime_type, size_bytes, category")
        .order("created_at", { ascending: false });
      return (data ?? []) as ResourceItem[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["recursos-list"] });

  async function uploadFile(file: File) {
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    const safe = file.name.replace(/[^\w.\-]/g, "_");
    const path = `${crypto.randomUUID()}-${safe}`;
    const { error: upErr } = await supabase.storage.from("resources").upload(path, file, {
      contentType: file.type || undefined,
    });
    if (upErr) {
      setUploading(false);
      toast.error("No se pudo subir", { description: upErr.message });
      return;
    }
    const { error } = await table().insert({
      kind: "file",
      title: file.name,
      file_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      category: newCat(),
      created_by: u.user?.id ?? null,
    });
    setUploading(false);
    if (error) {
      await supabase.storage.from("resources").remove([path]);
      toast.error("No se pudo guardar", { description: error.message });
      return;
    }
    toast.success("Archivo subido ✓");
    refresh();
  }

  async function addUrl() {
    if (!urlTitle.trim() || !urlValue.trim()) {
      toast.error("Título y URL son obligatorios");
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await table().insert({
      kind: "url",
      title: urlTitle.trim(),
      url: urlValue.trim(),
      category: newCat(),
      created_by: u.user?.id ?? null,
    });
    if (error) {
      toast.error("No se pudo guardar", { description: error.message });
      return;
    }
    toast.success("Enlace añadido ✓");
    setUrlTitle("");
    setUrlValue("");
    setAddingUrl(false);
    refresh();
  }

  async function openResource(r: ResourceItem) {
    if (r.kind === "url" && r.url) {
      window.open(r.url, "_blank", "noopener");
      return;
    }
    if (r.kind === "file" && r.file_path) {
      const { data, error } = await supabase.storage.from("resources").createSignedUrl(r.file_path, 300);
      if (error || !data?.signedUrl) {
        toast.error("No se pudo abrir el archivo");
        return;
      }
      const mime = r.mime_type ?? "";
      if (mime.startsWith("image/") || mime === "application/pdf") {
        setPreview({ title: r.title, url: data.signedUrl, mime });
      } else {
        window.open(data.signedUrl, "_blank", "noopener");
      }
    }
  }

  async function remove(r: ResourceItem) {
    const { error } = await table().delete().eq("id", r.id);
    if (error) {
      toast.error("No se pudo eliminar", { description: error.message });
      return;
    }
    if (r.kind === "file" && r.file_path) await supabase.storage.from("resources").remove([r.file_path]);
    toast.success("Recurso eliminado");
    refresh();
  }

  const q = search.trim().toLowerCase();
  const filtered = (resources ?? []).filter(
    (r) => (activeCat === "Todas" || r.category === activeCat) && (!q || r.title.toLowerCase().includes(q)),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {isLoading ? "Cargando…" : `${filtered.length} recurso${filtered.length === 1 ? "" : "s"}`}
          {activeCat !== "Todas" && ` · ${activeCat}`}
        </span>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? (
              <LoadingBar />
            ) : (
              <>
                <Upload className="h-4 w-4" /> Subir archivo
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => setAddingUrl((v) => !v)}>
            <LinkIcon className="h-4 w-4" /> Añadir enlace
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar recurso por nombre…"
          className="bg-card shadow-[var(--shadow-soft)]"
        />
        <div className="flex flex-wrap gap-2">
          {["Todas", ...RESOURCE_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCat(cat)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                activeCat === cat
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                  : "bg-card text-foreground shadow-[var(--shadow-elevated)] hover:opacity-90",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        {activeCat !== "Todas" && (
          <p className="text-xs text-muted-foreground">Los nuevos recursos se añadirán a «{activeCat}».</p>
        )}
      </div>

      {addingUrl && (
        <div className="space-y-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-elevated)]">
          <Input
            value={urlTitle}
            onChange={(e) => setUrlTitle(e.target.value)}
            placeholder="Título del enlace"
            className="bg-card shadow-[var(--shadow-soft)]"
          />
          <Input
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://…"
            className="bg-card shadow-[var(--shadow-soft)]"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddingUrl(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={addUrl}>
              Guardar enlace
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elevated)]">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
        ) : filtered.length > 0 ? (
          <ul className="divide-y divide-border">
            {filtered.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-foreground">
                  {r.kind === "url" ? <LinkIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </span>
                <button type="button" onClick={() => openResource(r)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-medium text-foreground">{r.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {r.kind === "url" ? r.url : (r.mime_type ?? "Archivo")}
                  </div>
                </button>
                <span className="hidden shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
                  {r.category}
                </span>
                <button
                  type="button"
                  onClick={() => remove(r)}
                  aria-label="Eliminar"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-destructive transition hover:opacity-80"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {q || activeCat !== "Todas"
              ? "No hay recursos que coincidan."
              : "Aún no hay recursos. Sube un archivo o añade un enlace."}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 duration-200 animate-in fade-in">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setPreview(null)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <div className="relative z-10 flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-float)]">
            <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
              <p className="truncate text-sm font-semibold text-foreground">{preview.title}</p>
              <div className="flex items-center gap-1.5">
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir en pestaña nueva"
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:text-foreground"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  aria-label="Cerrar"
                  className="grid h-9 w-9 place-items-center rounded-full bg-card text-muted-foreground shadow-[var(--shadow-elevated)] transition hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-auto bg-muted/30 p-2">
              {preview.mime?.startsWith("image/") ? (
                <img src={preview.url} alt={preview.title} className="mx-auto max-h-full max-w-full rounded-lg" />
              ) : (
                <iframe src={preview.url} title={preview.title} className="h-[76vh] w-full rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DietasPanel({ fullscreen }: { fullscreen: boolean }) {
  const [client, setClient] = useState<{ id: string; name: string } | null>(null);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clientes-dietas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .order("first_name");
      return data ?? [];
    },
  });

  if (client) {
    return (
      <DietEditor
        patientId={client.id}
        patientName={client.name}
        onBack={() => setClient(null)}
        fullscreen={fullscreen}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Elige un cliente para editar su dieta semanal.</p>
      <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elevated)]">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
        ) : clients && clients.length > 0 ? (
          <ul className="divide-y divide-border">
            {clients.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setClient({ id: c.id, name: `${c.first_name} ${c.last_name}`.trim() })}
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
            Aún no tienes clientes. Créalos en la tarjeta “Clientes”.
          </div>
        )}
      </div>
    </div>
  );
}

type RecipeOpt = {
  id: string;
  meal: string;
  title: string;
  content: string;
  ingredients: { name: string; amount: string }[];
  imageUrl: string | null;
};

function AutoResizeTextarea(props: React.ComponentProps<typeof Textarea>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);
  return (
    <Textarea
      {...props}
      ref={ref}
      rows={1}
      className={cn("min-h-0 resize-none overflow-hidden bg-card shadow-[var(--shadow-soft)]", props.className)}
      onChange={(e) => {
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
        props.onChange?.(e);
      }}
    />
  );
}

// Un producto a medida guarda "Nombre\nDescripción" en un único campo.
// Estos helpers separan/juntan ambas partes para editarlas por separado.
const nameOf = (c: string) => c.split("\n")[0] ?? "";
const descOf = (c: string) => c.split("\n").slice(1).join("\n");
const joinND = (n: string, d: string) => (d ? `${n}\n${d}` : n);

type BoardRecipe = { id: string; meal: string; title: string; content: string; imageUrl?: string | null };

function VisualDietBoard({
  activeDay,
  recipes,
  getCell,
  update,
  search,
  setSearch,
  dragOver,
  setDragOver,
  fullscreen,
}: {
  activeDay: number;
  recipes: BoardRecipe[];
  getCell: (key: string) => MealValue;
  update: (key: string, fn: (v: MealValue) => MealValue) => void;
  search: string;
  setSearch: (v: string) => void;
  dragOver: string | null;
  setDragOver: (v: string | null) => void;
  fullscreen: boolean;
}) {
  const [activeMeal, setActiveMeal] = useState<string | null>(null);
  const [customFor, setCustomFor] = useState<string | null>(null);
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const q = search.trim().toLowerCase();
  const palette = recipes.filter(
    (r) => (!activeMeal || r.meal === activeMeal) && (!q || r.title.toLowerCase().includes(q)),
  );

  const foodLabel = (opt: { recipeId: string; content: string }) => {
    const rec = recipes.find((r) => r.id === opt.recipeId);
    return rec ? rec.title : nameOf(opt.content).trim() || "Personalizada";
  };
  const addRecipe = (mealId: string, recipe: BoardRecipe) => {
    const key = `${activeDay}-${mealId}`;
    update(key, (v) => {
      const empty = v.options.length === 1 && !v.options[0].recipeId && !v.options[0].content.trim();
      if (empty) return { options: [{ recipeId: recipe.id, content: recipe.content }], joiners: [] };
      return {
        options: [...v.options, { recipeId: recipe.id, content: recipe.content }],
        joiners: [...v.joiners, "y"],
      };
    });
  };
  const removeFood = (mealId: string, idx: number) => {
    const key = `${activeDay}-${mealId}`;
    update(key, (v) =>
      v.options.length > 1
        ? {
            options: v.options.filter((_, i) => i !== idx),
            joiners: v.joiners.filter((_, i) => i !== (idx === 0 ? 0 : idx - 1)),
          }
        : { options: [{ recipeId: "", content: "" }], joiners: [] },
    );
  };
  const toggleJoiner = (mealId: string, idx: number) => {
    const key = `${activeDay}-${mealId}`;
    update(key, (v) => {
      const joiners = [...v.joiners];
      joiners[idx - 1] = joiners[idx - 1] === "y" ? "o" : "y";
      return { ...v, joiners };
    });
  };
  const addCustom = (mealId: string) => {
    const name = cName.trim();
    if (!name) return;
    const content = cDesc.trim() ? `${name}\n${cDesc.trim()}` : name;
    const key = `${activeDay}-${mealId}`;
    update(key, (v) => {
      const empty = v.options.length === 1 && !v.options[0].recipeId && !v.options[0].content.trim();
      if (empty) return { options: [{ recipeId: "", content }], joiners: [] };
      return { options: [...v.options, { recipeId: "", content }], joiners: [...v.joiners, "y"] };
    });
    setCName("");
    setCDesc("");
    setCustomFor(null);
  };
  const moveFood = (mealId: string, idx: number, dir: -1 | 1) => {
    const key = `${activeDay}-${mealId}`;
    update(key, (v) => {
      const j = idx + dir;
      if (j < 0 || j >= v.options.length) return v;
      const options = [...v.options];
      [options[idx], options[j]] = [options[j], options[idx]];
      return { ...v, options };
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[290px_1fr]">
      {/* Paleta de recetas (arrastrables) */}
      <div className="space-y-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar receta…"
          className="bg-card shadow-[var(--shadow-soft)]"
        />
        {activeMeal ? (
          <button
            type="button"
            onClick={() => setActiveMeal(null)}
            className="flex w-full items-center justify-between gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90"
          >
            <span className="truncate">Recetas de {MEALS.find((m) => m.id === activeMeal)?.label}</span>
            <X className="h-3.5 w-3.5 shrink-0" />
          </button>
        ) : (
          <p className="text-xs text-muted-foreground">Pulsa una comida para filtrar sus recetas, o arrastra a cualquiera.</p>
        )}
        <div className="max-h-[62vh] space-y-2 overflow-auto pr-1">
          {palette.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Sin recetas.</p>
          ) : (
            palette.map((r) => (
              <div
                key={r.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", r.id)}
                className="cursor-grab rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-elevated)] transition hover:-translate-y-0.5 active:cursor-grabbing"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary-soft text-foreground">
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {MEALS.find((m) => m.id === r.meal)?.label ?? r.meal}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Comidas del día (zonas de soltado) */}
      <div className={cn("grid gap-2.5 sm:grid-cols-2", fullscreen && "lg:grid-cols-3")}>
        {MEALS.map((m) => {
          const key = `${activeDay}-${m.id}`;
          const cell = getCell(key);
          const hasFood = cell.options.some((o) => o.recipeId || o.content.trim());
          const isOver = dragOver === m.id;
          return (
            <div
              key={m.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOver !== m.id) setDragOver(m.id);
              }}
              onDragLeave={() => setDragOver(dragOver === m.id ? null : dragOver)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData("text/plain");
                const rec = recipes.find((r) => r.id === id);
                if (rec) addRecipe(m.id, rec);
              }}
              className={cn(
                "rounded-2xl border-2 border-dashed p-2.5 transition",
                isOver
                  ? "border-primary bg-primary-soft/40"
                  : activeMeal === m.id
                    ? "border-primary/60 bg-primary-soft/20"
                    : "border-border bg-card/60",
              )}
            >
              <button
                type="button"
                onClick={() => setActiveMeal(activeMeal === m.id ? null : m.id)}
                title="Filtrar recetas de esta comida"
                className="mb-1.5 flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="text-sm font-semibold text-foreground">{m.label}</span>
                {activeMeal === m.id && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    filtrando
                  </span>
                )}
              </button>
              {!hasFood ? (
                <p className="rounded-xl bg-secondary/40 py-3 text-center text-[11px] text-muted-foreground">
                  Arrastra recetas aquí
                </p>
              ) : (
                <ul className={cn("space-y-1", fullscreen ? "max-h-[20vh] overflow-y-auto pr-0.5" : "")}>
                  {cell.options.map((opt, i) =>
                    opt.recipeId || opt.content.trim() ? (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2 rounded-lg bg-card px-2 py-1.5 shadow-[var(--shadow-soft)]"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {i > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleJoiner(m.id, i)}
                              title="Cambiar entre Y (junto) y Ó (alternativa)"
                              className="shrink-0 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground transition hover:opacity-90"
                            >
                              {cell.joiners[i - 1] === "o" ? "Ó" : "Y"}
                            </button>
                          )}
                          <span className="truncate text-sm text-foreground">{foodLabel(opt)}</span>
                        </span>
                        <div className="flex shrink-0 items-center">
                          <button
                            type="button"
                            onClick={() => moveFood(m.id, i, -1)}
                            disabled={i === 0}
                            aria-label="Subir"
                            title="Subir"
                            className="grid h-6 w-5 place-items-center rounded text-muted-foreground transition hover:text-foreground disabled:opacity-25"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFood(m.id, i, 1)}
                            disabled={i === cell.options.length - 1}
                            aria-label="Bajar"
                            title="Bajar"
                            className="grid h-6 w-5 place-items-center rounded text-muted-foreground transition hover:text-foreground disabled:opacity-25"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFood(m.id, i)}
                            aria-label="Quitar"
                            className="ml-0.5 grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ) : null,
                  )}
                </ul>
              )}

              {customFor === m.id ? (
                <div className="mt-2 space-y-1.5 rounded-xl bg-secondary/40 p-2">
                  <Input
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="Nombre del producto"
                    autoFocus
                    className="h-8 bg-card text-sm shadow-[var(--shadow-soft)]"
                  />
                  <Input
                    value={cDesc}
                    onChange={(e) => setCDesc(e.target.value)}
                    placeholder="Descripción / cantidad (opcional)"
                    className="h-8 bg-card text-sm shadow-[var(--shadow-soft)]"
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() => {
                        setCustomFor(null);
                        setCName("");
                        setCDesc("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="button" size="sm" className="h-7" onClick={() => addCustom(m.id)}>
                      Añadir
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCustomFor(m.id);
                    setCName("");
                    setCDesc("");
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> Producto a medida
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DietEditor({
  patientId,
  patientName,
  onBack,
  fullscreen,
}: {
  patientId: string;
  patientName: string;
  onBack: () => void;
  fullscreen: boolean;
}) {
  const qc = useQueryClient();
  const [week, setWeek] = useState(1);
  const [activeDay, setActiveDay] = useState<number>(DAYS[0].id);
  const [rows, setRows] = useState<Record<string, MealValue>>({});
  const [saving, setSaving] = useState(false);
  const [pendingNew, setPendingNew] = useState<Record<string, string>>({});
  const [openMeal, setOpenMeal] = useState<string | null>(null);
  const [paletteSearch, setPaletteSearch] = useState("");
  const [dragOverMeal, setDragOverMeal] = useState<string | null>(null);

  const { data: recipes } = useQuery({
    queryKey: ["recipes-diet"],
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("id, meal, title, content, ingredients, image_path")
        .order("title");
      return (data ?? []).map((r) => ({
        id: r.id,
        meal: r.meal as string,
        title: r.title,
        content: r.content || renderIngredients(ensureIngredients(r.ingredients)),
        ingredients: ensureIngredients(r.ingredients),
        imageUrl: recipeImageUrl(r.image_path),
      })) as RecipeOpt[];
    },
  });

  const recipesByMeal = (recipes ?? []).reduce<Record<string, RecipeOpt[]>>((acc, r) => {
    (acc[r.meal] ||= []).push(r);
    return acc;
  }, {});

  const { data, isLoading } = useQuery({
    queryKey: ["diet", patientId, week],
    queryFn: async () => {
      const { data } = await supabase
        .from("diets")
        .select("day_of_week, meal, content")
        .eq("patient_id", patientId)
        .eq("week_number", week);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!recipes) return;
    const map: Record<string, MealValue> = {};
    for (const r of data ?? []) {
      map[`${r.day_of_week}-${r.meal}`] = parseMeal(
        r.content ?? "",
        (c) => recipes.find((rec) => rec.meal === r.meal && rec.content === c)?.id ?? "",
      );
    }
    setRows(map);
  }, [data, recipes]);

  function getCell(key: string): MealValue {
    return rows[key] ?? { options: [{ recipeId: "", content: "" }], joiners: [] };
  }
  function update(key: string, fn: (v: MealValue) => MealValue) {
    setRows((r) => ({ ...r, [key]: fn(r[key] ?? { options: [{ recipeId: "", content: "" }], joiners: [] }) }));
  }

  async function save() {
    setSaving(true);
    const payload: { patient_id: string; week_number: number; day_of_week: number; meal: string; content: string }[] = [];
    const deletes: Promise<unknown>[] = [];
    for (const d of DAYS) {
      for (const m of MEALS) {
        const key = `${d.id}-${m.id}`;
        const content = rows[key] ? serializeMeal(rows[key]) : "";
        if (content.trim()) {
          payload.push({ patient_id: patientId, week_number: week, day_of_week: d.id, meal: m.id, content });
        } else {
          deletes.push(
            (async () => {
              await supabase
                .from("diets")
                .delete()
                .eq("patient_id", patientId)
                .eq("week_number", week)
                .eq("day_of_week", d.id)
                .eq("meal", m.id);
            })(),
          );
        }
      }
    }
    await Promise.all(deletes);
    if (payload.length) {
      const { error } = await supabase
        .from("diets")
        .upsert(payload as never, { onConflict: "patient_id,week_number,day_of_week,meal" });
      if (error) {
        setSaving(false);
        toast.error("No se pudo guardar", { description: error.message });
        return;
      }
    }
    setSaving(false);
    toast.success("Dieta guardada ✓");
    qc.invalidateQueries({ queryKey: ["diet", patientId, week] });
  }

  function dayFilled(dayId: number) {
    return MEALS.some((m) => serializeMeal(getCell(`${dayId}-${m.id}`)).trim());
  }

  const [pdfLoading, setPdfLoading] = useState(false);
  async function downloadPdf() {
    setPdfLoading(true);
    try {
      const pdfRows: DietRow[] = [];
      for (const d of DAYS) {
        for (const m of MEALS) {
          const cell = getCell(`${d.id}-${m.id}`);
          // Enriquecer cada alimento con el nombre de la receta como 1ª línea.
          const enriched = {
            options: cell.options.map((o) => {
              const rec = recipes?.find((r) => r.id === o.recipeId);
              const content = rec
                ? rec.title + (o.content?.trim() ? `\n${o.content.trim()}` : "")
                : o.content;
              return { recipeId: "", content };
            }),
            joiners: cell.joiners,
          };
          const content = serializeMeal(enriched);
          if (content.trim()) pdfRows.push({ day_of_week: d.id, meal: m.id, content });
        }
      }
      if (pdfRows.length === 0) {
        toast.error("La dieta está vacía", { description: "Añade alguna comida antes de descargar." });
        return;
      }
      await buildDietPdf({ patientName, weekNumber: week, rows: pdfRows });
    } catch {
      toast.error("No se pudo generar el PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition hover:text-primary"
        >
          <ChevronRight className="h-4 w-4 rotate-180 text-muted-foreground" /> {patientName}
        </button>
        <div className="flex items-center gap-2">
          <Label htmlFor="diet-week" className="text-sm">
            Semana
          </Label>
          <Input
            id="diet-week"
            type="number"
            min={1}
            value={week}
            onChange={(e) => setWeek(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 bg-card shadow-[var(--shadow-elevated)]"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={downloadPdf}
            disabled={pdfLoading}
            title="Descargar la dieta de este cliente en PDF"
          >
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? (
              <LoadingBar />
            ) : (
              <>
                <Plus className="h-4 w-4" /> Guardar
              </>
            )}
          </Button>
        </div>
      </div>

      {(recipes?.length ?? 0) === 0 && (
        <div className="rounded-2xl bg-secondary/50 p-4 text-sm text-foreground">
          Aún no hay recetas. Créalas en la tarjeta “Recetas” para poder asignarlas.
        </div>
      )}

      <div
        className={cn(
          "gap-2",
          fullscreen
            ? "fixed left-1/2 top-4 z-[56] flex max-w-[70vw] -translate-x-1/2 flex-nowrap overflow-x-auto rounded-full bg-card/90 p-1.5 shadow-[var(--shadow-float)] backdrop-blur"
            : "flex flex-wrap",
        )}
      >
        {DAYS.map((d) => {
          const active = activeDay === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDay(d.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                  : "bg-card text-foreground shadow-[var(--shadow-elevated)] hover:opacity-90",
              )}
            >
              {d.label}
              {dayFilled(d.id) && (
                <span
                  className={cn(
                    "ml-2 inline-block h-1.5 w-1.5 rounded-full align-middle",
                    active ? "bg-primary-foreground" : "bg-primary",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
      ) : (
        <VisualDietBoard
          activeDay={activeDay}
          recipes={recipes ?? []}
          getCell={getCell}
          update={update}
          search={paletteSearch}
          setSearch={setPaletteSearch}
          dragOver={dragOverMeal}
          setDragOver={setDragOverMeal}
          fullscreen={fullscreen}
        />
      )}
      {false && (
        <div className="space-y-4">
          {MEALS.map((m) => {
            const key = `${activeDay}-${m.id}`;
            const cell = getCell(key);
            // Mostrar TODAS las recetas en cada comida (las de esta comida primero),
            // para que el desplegable siempre lea de la base de datos aunque la
            // receta esté clasificada en otra comida.
            const options = [
              ...(recipesByMeal[m.id] ?? []),
              ...(recipes ?? []).filter((r) => r.meal !== m.id),
            ];
            const isOpen = openMeal === m.id;
            const summary = cell.options
              .map((opt) => {
                const src = options.find((o) => o.id === opt.recipeId);
                return src?.title || opt.content.split("\n")[0]?.trim() || "";
              })
              .filter(Boolean)
              .join(" · ");
            // Agrupar por alternativas: cada "O" abre una nueva Opción, cada "Y"
            // añade un plato a la opción actual. Base para la vista previa en vivo.
            // Solo se muestran los platos con contenido (el que se está escribiendo
            // aparece en cuanto se teclea).
            const previewGroups: { title: string; body: string; idx: number }[][] = [[]];
            cell.options.forEach((opt, i) => {
              const src = options.find((o) => o.id === opt.recipeId);
              const title = src ? src.title : nameOf(opt.content).trim();
              const body = (src ? opt.content : descOf(opt.content)).trim();
              if (i > 0 && cell.joiners[i - 1] === "o") previewGroups.push([]);
              if (title || body) previewGroups[previewGroups.length - 1].push({ title, body, idx: i });
            });
            const groups = previewGroups.filter((g) => g.length > 0);
            const hasAny = groups.length > 0;
            const removeOption = (idx: number) =>
              update(key, (v) =>
                v.options.length > 1
                  ? {
                      options: v.options.filter((_, x) => x !== idx),
                      joiners: v.joiners.filter((_, x) => x !== (idx === 0 ? 0 : idx - 1)),
                    }
                  : { options: [{ recipeId: "", content: "" }], joiners: [] },
              );
            return (
              <div key={m.id} className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elevated)]">
                <button
                  type="button"
                  onClick={() => setOpenMeal(isOpen ? null : m.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{m.label}</span>
                    {!isOpen && summary && (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{summary}</span>
                    )}
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-90",
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="space-y-3 px-4 pb-4 duration-200 animate-in fade-in slide-in-from-top-1">
                    {/* Vista previa en vivo de la dieta de esta comida */}
                    <div className="rounded-xl bg-secondary/40 p-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Dieta de {m.label.toLowerCase()}
                      </p>
                      {hasAny ? (
                        <div className="space-y-2 text-sm">
                          {groups.map((group, gi) => (
                            <div
                              key={gi}
                              className="rounded-lg bg-card p-2.5 shadow-[var(--shadow-soft)]"
                            >
                              {groups.length > 1 && (
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                                  Opción {gi + 1}
                                </p>
                              )}
                              <div className="space-y-1.5">
                                {group.map((it, ii) => (
                                  <div key={ii} className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-0.5 sm:flex-row">
                                      <div className="flex min-w-0 items-start gap-2 sm:w-44 sm:shrink-0">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                                        {it.title && (
                                          <span className="font-semibold text-foreground">{it.title}</span>
                                        )}
                                      </div>
                                      {it.body && (
                                        <p className="whitespace-pre-wrap pl-3.5 text-muted-foreground sm:flex-1 sm:pl-0">
                                          {it.body}
                                        </p>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeOption(it.idx)}
                                      aria-label="Quitar de la dieta"
                                      title="Quitar de la dieta"
                                      className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm italic text-muted-foreground/70">
                          Aún nada. Elige una receta o escribe un producto y se irá escribiendo aquí.
                        </p>
                      )}
                    </div>

                    {cell.options.map((opt, i) => {
                  // Solo se edita la receta actual (la última); las ya añadidas
                  // viven en el panel de arriba.
                  if (i !== cell.options.length - 1) return null;
                  const optKey = `${key}-${i}`;
                  const pendingTitle = pendingNew[optKey];
                  const source = options.find((o) => o.id === opt.recipeId);
                  const isCustom = !!pendingTitle || (!!opt.content.trim() && (!source || source.content !== opt.content));
                  const clearPending = () =>
                    setPendingNew((p) => {
                      if (!(optKey in p)) return p;
                      const next = { ...p };
                      delete next[optKey];
                      return next;
                    });
                  return (
                    <div key={i} className="space-y-2">
                      {i > 0 && (
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          <div className="h-px flex-1 bg-border" />
                          <span>
                            {cell.joiners[i - 1] === "o"
                              ? "Nueva alternativa (opción)"
                              : "Otro alimento de esta opción"}
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_1fr]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <RecipeCombobox
                              recipes={options}
                              value={opt.recipeId}
                              isCustom={isCustom}
                              customLabel={pendingTitle ?? (opt.content.split("\n")[0].trim() || "Personalizada")}
                              onClear={() => {
                                clearPending();
                                update(key, (v) => {
                                  const next = [...v.options];
                                  next[i] = { recipeId: "", content: "" };
                                  return { ...v, options: next };
                                });
                              }}
                              onSelect={(rec) => {
                                clearPending();
                                update(key, (v) => {
                                  const next = [...v.options];
                                  next[i] = { recipeId: rec.id, content: rec.content };
                                  return { ...v, options: next };
                                });
                              }}
                              onUseLocal={(title) => {
                                clearPending();
                                update(key, (v) => {
                                  const next = [...v.options];
                                  next[i] = { recipeId: "", content: title };
                                  return { ...v, options: next };
                                });
                              }}
                              onCreate={(title) => {
                                setPendingNew((p) => ({ ...p, [optKey]: title }));
                                update(key, (v) => {
                                  const next = [...v.options];
                                  next[i] = { recipeId: "", content: "" };
                                  return { ...v, options: next };
                                });
                              }}
                            />
                          </div>
                          {isCustom && (
                            <span className="inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium">
                              Personalizada
                            </span>
                          )}
                          {source && source.content !== opt.content && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                update(key, (v) => {
                                  const next = [...v.options];
                                  next[i] = { recipeId: source.id, content: source.content };
                                  return { ...v, options: next };
                                })
                              }
                            >
                              <Pencil className="h-3.5 w-3.5" /> Restaurar original
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {opt.recipeId === "" && !pendingTitle ? (
                            <>
                              <Input
                                value={nameOf(opt.content)}
                                onChange={(e) =>
                                  update(key, (v) => {
                                    const next = [...v.options];
                                    next[i] = { recipeId: "", content: joinND(e.target.value, descOf(opt.content)) };
                                    return { ...v, options: next };
                                  })
                                }
                                placeholder="Nombre del producto"
                                className="bg-card font-medium shadow-[var(--shadow-elevated)]"
                              />
                              <AutoResizeTextarea
                                value={descOf(opt.content)}
                                onChange={(e) =>
                                  update(key, (v) => {
                                    const next = [...v.options];
                                    next[i] = { recipeId: "", content: joinND(nameOf(opt.content), e.target.value) };
                                    return { ...v, options: next };
                                  })
                                }
                                placeholder="Descripción: ingredientes, cantidades y preparación…"
                              />
                            </>
                          ) : (
                            <AutoResizeTextarea
                              value={opt.content}
                              onChange={(e) =>
                                update(key, (v) => {
                                  const next = [...v.options];
                                  next[i] = { recipeId: "", content: e.target.value };
                                  return { ...v, options: next };
                                })
                              }
                              placeholder="Ingredientes, cantidades y preparación…"
                            />
                          )}
                          {pendingTitle && (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary-soft/60 px-3 py-2">
                              <p className="text-xs text-foreground/80">
                                Añade el contenido y pulsa <strong>Guardar</strong> para almacenar «{pendingTitle}» en la base de datos.
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                onClick={async () => {
                                  const content = opt.content.trim();
                                  const { data: u } = await supabase.auth.getUser();
                                  const { data: created, error } = await supabase
                                    .from("recipes")
                                    .insert({
                                      meal: m.id,
                                      title: pendingTitle,
                                      content,
                                      ingredients: content
                                        ? content
                                            .split("\n")
                                            .filter((l) => l.trim())
                                            .map((l) => ({ name: l.trim(), amount: "" }))
                                        : [],
                                      created_by: u.user?.id ?? null,
                                    } as never)
                                    .select("id")
                                    .single();
                                  if (error || !created) {
                                    toast.error("No se pudo guardar la receta");
                                    return;
                                  }
                                  await qc.invalidateQueries({ queryKey: ["recipes-diet"] });
                                  toast.success("Receta añadida a la base de datos");
                                  clearPending();
                                  update(key, (v) => {
                                    const next = [...v.options];
                                    next[i] = { recipeId: created.id, content };
                                    return { ...v, options: next };
                                  });
                                }}
                              >
                                Guardar
                              </Button>
                            </div>
                          )}
                          {i === cell.options.length - 1 && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                title="Este alimento se toma junto a los anteriores de la misma opción"
                                onClick={() => {
                                  if (!opt.recipeId && !opt.content.trim()) return;
                                  update(key, (v) => ({
                                    options: [...v.options, { recipeId: "", content: "" }],
                                    joiners: [...v.joiners, "y"],
                                  }));
                                }}
                              >
                                <Plus className="h-4 w-4" /> Añadir alimento
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                title="Crea una opción alternativa que el paciente puede elegir en su lugar"
                                onClick={() => {
                                  if (!opt.recipeId && !opt.content.trim()) return;
                                  update(key, (v) => ({
                                    options: [...v.options, { recipeId: "", content: "" }],
                                    joiners: [...v.joiners, "o"],
                                  }));
                                }}
                              >
                                <Plus className="h-4 w-4" /> Añadir alternativa
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="ml-auto"
                                title="Guardar la dieta y colapsar esta comida"
                                disabled={saving}
                                onClick={async () => {
                                  await save();
                                  setOpenMeal(null);
                                }}
                              >
                                {saving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Save className="h-4 w-4" /> Guardar
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
