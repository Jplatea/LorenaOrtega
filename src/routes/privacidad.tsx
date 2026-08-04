import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LEGAL_INFO } from "@/components/legal-layout";

export const Route = createFileRoute("/privacidad")({
  head: () => ({ meta: [{ title: "Política de privacidad — Lorena Ortega Dietética" }] }),
  component: Privacidad,
});

function Privacidad() {
  return (
    <LegalLayout title="Política de privacidad" updated="agosto de 2026">
      <section>
        <h2>1. Responsable del tratamiento</h2>
        <ul>
          <li>Responsable: {LEGAL_INFO.titular} ({LEGAL_INFO.marca})</li>
          <li>NIF: {LEGAL_INFO.nif}</li>
          <li>Domicilio: {LEGAL_INFO.domicilio}</li>
          <li>Correo electrónico: {LEGAL_INFO.email}</li>
        </ul>
      </section>

      <section>
        <h2>2. Datos que tratamos y finalidad</h2>
        <ul>
          <li>
            <strong>Datos de contacto</strong> (nombre, email, teléfono y mensaje) enviados a través del formulario de
            reserva o contacto: para atender tu solicitud y concertar una consulta.
          </li>
          <li>
            <strong>Datos de paciente</strong> (datos identificativos, de contacto y datos de salud como objetivos,
            hábitos, medidas o analíticas): para prestar el servicio de asesoramiento nutricional y elaborar y hacer el
            seguimiento de tu plan.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Base jurídica</h2>
        <p>
          El tratamiento de los datos de contacto se basa en tu <strong>consentimiento</strong> (art. 6.1.a RGPD) y en
          la aplicación de medidas precontractuales a petición tuya. La prestación del servicio se basa en la{" "}
          <strong>ejecución del contrato</strong> (art. 6.1.b). El tratamiento de <strong>datos de salud</strong>{" "}
          (categoría especial) se realiza con tu <strong>consentimiento explícito</strong> (art. 9.2.a) y con fines de
          asistencia sanitaria (art. 9.2.h).
        </p>
      </section>

      <section>
        <h2>4. Conservación</h2>
        <p>
          Los datos de contacto se conservan mientras gestionamos tu solicitud y, si no llegas a ser paciente, se
          suprimen posteriormente. Los datos de paciente se conservan durante la relación asistencial y, después,
          durante los plazos legalmente exigibles.
        </p>
      </section>

      <section>
        <h2>5. Destinatarios y encargados del tratamiento</h2>
        <p>
          No se ceden datos a terceros salvo obligación legal. Para el funcionamiento del sitio y del área privada
          utilizamos proveedores que actúan como encargados del tratamiento con las debidas garantías: alojamiento y
          base de datos (Supabase) y despliegue web (Vercel). Estos proveedores pueden tratar datos en servidores
          ubicados en la Unión Europea.
        </p>
      </section>

      <section>
        <h2>6. Tus derechos</h2>
        <p>
          Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y
          portabilidad, así como retirar tu consentimiento en cualquier momento, escribiendo a{" "}
          <a href={`mailto:${LEGAL_INFO.email}`}>{LEGAL_INFO.email}</a>. Si consideras que no hemos atendido
          correctamente tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (
          <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
            www.aepd.es
          </a>
          ).
        </p>
      </section>

      <section>
        <h2>7. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas apropiadas para proteger tus datos, con acceso restringido por
          roles y comunicaciones cifradas.
        </p>
      </section>
    </LegalLayout>
  );
}
