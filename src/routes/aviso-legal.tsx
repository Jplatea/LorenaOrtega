import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LEGAL_INFO } from "@/components/legal-layout";

export const Route = createFileRoute("/aviso-legal")({
  head: () => ({ meta: [{ title: "Aviso legal — Lorena Ortega Dietética" }] }),
  component: AvisoLegal,
});

function AvisoLegal() {
  return (
    <LegalLayout title="Aviso legal" updated="agosto de 2026">
      <section>
        <h2>1. Datos identificativos</h2>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de
          Comercio Electrónico (LSSI-CE), se informa de que el titular de este sitio web es:
        </p>
        <ul>
          <li>Titular: {LEGAL_INFO.titular}</li>
          <li>NIF: {LEGAL_INFO.nif}</li>
          <li>Domicilio: {LEGAL_INFO.domicilio}</li>
          <li>Correo electrónico: {LEGAL_INFO.email}</li>
          <li>Sitio web: {LEGAL_INFO.dominio}</li>
        </ul>
      </section>

      <section>
        <h2>2. Objeto</h2>
        <p>
          El presente sitio web tiene por objeto ofrecer información sobre los servicios de nutrición y dietética de{" "}
          {LEGAL_INFO.marca}, así como facilitar a los pacientes el acceso a un área privada con su plan nutricional,
          recetas y documentación.
        </p>
      </section>

      <section>
        <h2>3. Condiciones de uso</h2>
        <p>
          El acceso y uso de este sitio atribuye la condición de usuario e implica la aceptación de las presentes
          condiciones. El usuario se compromete a hacer un uso adecuado de los contenidos y a no emplearlos para
          actividades ilícitas o contrarias a la buena fe. El área privada es de uso personal e intransferible.
        </p>
      </section>

      <section>
        <h2>4. Propiedad intelectual e industrial</h2>
        <p>
          Todos los contenidos del sitio (textos, diseño, logotipos, recetas y demás elementos) son titularidad de{" "}
          {LEGAL_INFO.titular} o cuentan con la correspondiente autorización, y están protegidos por la normativa de
          propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o transformación sin
          autorización expresa.
        </p>
      </section>

      <section>
        <h2>5. Responsabilidad</h2>
        <p>
          La información publicada tiene carácter general y no sustituye el diagnóstico ni el consejo profesional
          individualizado. {LEGAL_INFO.marca} no se responsabiliza de los daños derivados de un uso indebido del sitio
          ni de las interrupciones del servicio ajenas a su control.
        </p>
      </section>

      <section>
        <h2>6. Legislación aplicable</h2>
        <p>
          Las presentes condiciones se rigen por la legislación española. Para cualquier controversia, las partes se
          someten a los juzgados y tribunales que correspondan conforme a derecho.
        </p>
      </section>
    </LegalLayout>
  );
}
