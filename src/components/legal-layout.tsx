import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

// Datos del titular a efectos legales — EDITA con los reales.
export const LEGAL_INFO = {
  titular: "Lorena Ortega", // nombre y apellidos del titular
  marca: "Lorena Ortega Dietética",
  nif: "00000000X", // NIF / DNI del titular
  domicilio: "[Dirección de la consulta]", // domicilio a efectos de notificaciones
  email: "hola@lorenaortega.es",
  dominio: "lorenaortega.es",
};

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15">
              <Leaf className="h-4 w-4 text-primary" />
            </span>
            {LEGAL_INFO.marca}
          </Link>
          <Link to="/" className="text-sm text-muted-foreground transition hover:text-foreground">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última actualización: {updated}</p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/80 [&_a]:text-primary [&_a]:underline [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-4 [&_li]:list-disc [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:space-y-1">
          {children}
        </div>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {LEGAL_INFO.marca} ·{" "}
        <Link to="/aviso-legal" className="transition hover:text-foreground">
          Aviso legal
        </Link>{" "}
        ·{" "}
        <Link to="/privacidad" className="transition hover:text-foreground">
          Privacidad
        </Link>{" "}
        ·{" "}
        <Link to="/cookies" className="transition hover:text-foreground">
          Cookies
        </Link>
      </footer>
    </div>
  );
}
