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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

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

  return (
    <div className="min-h-dvh bg-background">
      {/* 1. Navbar */}
      <header className="sticky top-0 z-50 bg-ink text-ink-foreground">
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

            <div className="flex items-center gap-2">
              <nav className="hidden items-center gap-7 md:flex">
                {navLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="text-[13px] text-ink-muted transition-colors hover:text-ink-foreground"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
              <Button asChild size="sm" className="hidden md:inline-flex">
                <Link to="/auth">Acceder</Link>
              </Button>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-card md:hidden"
              >
                {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {open && (
            <nav className="flex flex-col gap-1 border-t border-ink-muted/20 py-4 md:hidden">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm text-ink-muted hover:bg-ink-card hover:text-ink-foreground"
                >
                  {l.label}
                </a>
              ))}
              <Button asChild className="mt-2 w-full">
                <Link to="/auth">Acceder</Link>
              </Button>
            </nav>
          )}
        </div>
      </header>

      {/* 2. Hero */}
      <section id="inicio" className="aurora-bg overflow-hidden text-ink-foreground">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-36">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-muted/25 bg-ink-card/70 px-4 py-1.5 text-xs text-ink-muted backdrop-blur">
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
            <p className="mx-auto mt-6 max-w-xl text-base text-ink-muted sm:text-lg">
              Planes semanales, recetas y seguimiento profesional en un único espacio privado.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mx-auto mt-10 flex w-full max-w-xl flex-col gap-2 rounded-3xl border border-ink-muted/20 bg-ink-card/80 p-2 shadow-[var(--shadow-float)] backdrop-blur sm:flex-row sm:rounded-full sm:items-center"
            >
              <label htmlFor="hero-email" className="sr-only">
                Tu email
              </label>
              <input
                id="hero-email"
                type="email"
                placeholder="tucorreo@email.com"
                className="min-w-0 flex-1 rounded-full bg-transparent px-5 py-3 text-sm text-ink-foreground placeholder:text-ink-muted focus:outline-none"
              />
              <Button type="submit" size="lg" className="shrink-0 sm:h-11">
                Reservar consulta <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </Reveal>
        </div>
      </section>

      {/* 3. Sección gradiente + mockup */}
      <section id="servicios" className="canvas-gradient">
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
      <section className="bg-background">
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
            <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-ink-foreground shadow-[var(--shadow-float)] sm:p-8">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-destructive/70" />
                <span className="h-3 w-3 rounded-full bg-secondary" />
                <span className="h-3 w-3 rounded-full bg-primary" />
              </div>
              <div className="relative z-10 mt-7 space-y-4 text-sm">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink-card px-4 py-3 text-ink-muted">
                  Quiero un plan de 5 comidas, sin lactosa, para entrenar por la tarde.
                </div>
                <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-primary/20 px-4 py-3">
                  Plan semanal generado: 5 comidas al día, sin lactosa, con carbohidrato de calidad
                  en almuerzo y cena previa al entrenamiento.
                </div>
                <div className="rounded-2xl border border-ink-muted/20 px-4 py-3 text-ink-muted">
                  <div className="text-xs uppercase tracking-wider">Resumen</div>
                  <div className="mt-2 grid grid-cols-3 gap-3 text-center">
                    {[
                      ["1.540", "kcal"],
                      ["120 g", "proteína"],
                      ["7", "días"],
                    ].map(([v, l]) => (
                      <div key={l} className="rounded-xl bg-ink-card px-2 py-3">
                        <div className="text-base font-semibold text-ink-foreground">{v}</div>
                        <div className="text-[11px]">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. Perfiles */}
      <section className="bg-surface">
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
      <section className="bg-background px-4 pb-20 sm:px-6 sm:pb-28">
        <Reveal className="mx-auto max-w-7xl">
          <div className="grid overflow-hidden rounded-3xl shadow-[var(--shadow-float)] lg:grid-cols-2">
            <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden bg-ink p-10 text-ink-foreground">
              <div className="pointer-events-none absolute h-64 w-64 rounded-full bg-primary/45 blur-3xl" />
              <div className="relative z-10 text-center">
                <Leaf className="mx-auto h-9 w-9 text-primary" />
                <h3 className="mt-5 text-2xl font-bold sm:text-3xl">
                  Todo tu historial,
                  <br />
                  siempre contigo
                </h3>
                <p className="mx-auto mt-3 max-w-xs text-sm text-ink-muted">
                  Acceso privado y seguro a tus planes y documentos.
                </p>
              </div>
            </div>
            <div className="teal-panel p-10 text-ink-foreground">
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
              <Button asChild variant="ink" size="lg" className="mt-8">
                <Link to="/auth">
                  Entrar a mi área <ArrowRight className="h-4 w-4" />
                </Link>
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
          <div className="wire-lines overflow-hidden rounded-3xl bg-ink px-6 py-20 text-center text-ink-foreground sm:py-24">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
              Empieza tu cambio hoy.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-ink-muted sm:text-base">
              Reserva tu primera consulta y recibe tu acceso privado.
            </p>
            <Button asChild size="lg" className="mt-9">
              <Link to="/auth">
                Acceder a mi cuenta <ArrowRight className="h-4 w-4" />
              </Link>
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
