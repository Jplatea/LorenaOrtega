import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("lo-cookies") !== "1") setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-float)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground sm:text-sm">
          Usamos solo almacenamiento técnico esencial para el funcionamiento del área privada. No usamos cookies de
          analítica ni publicidad.{" "}
          <Link to="/cookies" className="text-primary underline">
            Más información
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("lo-cookies", "1");
            setShow(false);
          }}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
