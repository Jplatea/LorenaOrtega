import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LEGAL_INFO } from "@/components/legal-layout";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ title: "Política de cookies — Lorena Ortega Dietética" }] }),
  component: Cookies,
});

function Cookies() {
  return (
    <LegalLayout title="Política de cookies" updated="agosto de 2026">
      <section>
        <h2>1. ¿Qué son las cookies?</h2>
        <p>
          Las cookies y tecnologías de almacenamiento similares son ficheros que se guardan en tu dispositivo al
          navegar. Sirven para que el sitio funcione o para recordar información entre visitas.
        </p>
      </section>

      <section>
        <h2>2. ¿Qué usamos en este sitio?</h2>
        <p>
          En {LEGAL_INFO.marca} usamos únicamente <strong>almacenamiento técnico esencial</strong>, necesario para el
          funcionamiento del área privada:
        </p>
        <ul>
          <li>
            <strong>Sesión de acceso</strong>: para mantener tu sesión iniciada de forma segura mientras usas tu área
            privada (almacenamiento local del proveedor de autenticación).
          </li>
          <li>
            <strong>Preferencia de aviso de cookies</strong>: para recordar que ya has visto este aviso.
          </li>
        </ul>
        <p>
          <strong>No utilizamos cookies de analítica, publicidad ni seguimiento de terceros.</strong>
        </p>
      </section>

      <section>
        <h2>3. Gestión de cookies</h2>
        <p>
          Al ser almacenamiento técnico imprescindible, no requiere tu consentimiento. Puedes borrar en cualquier
          momento los datos almacenados desde la configuración de tu navegador; ten en cuenta que, si eliminas la
          sesión, deberás volver a iniciar sesión para acceder a tu área privada.
        </p>
      </section>

      <section>
        <h2>4. Más información</h2>
        <p>
          Para cualquier duda sobre esta política puedes escribirnos a{" "}
          <a href={`mailto:${LEGAL_INFO.email}`}>{LEGAL_INFO.email}</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
