import type { Metadata } from "next";
import GuideShell from "../guide-shell";
import { CONTACT_EMAIL } from "../site-config";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Información legal, condiciones de uso y contacto de Gasoliguapis.",
  alternates: { canonical: "/aviso-legal" },
};

export default function LegalNoticePage() {
  return (
    <GuideShell eyebrow="INFORMACIÓN LEGAL" title="Aviso legal" lead="Condiciones básicas de acceso y uso de Gasoliguapis.">
      <section>
        <h2>Titular y contacto</h2>
        <p>Gasoliguapis es un proyecto independiente de información sobre estaciones de servicio en España. Para cualquier comunicación relacionada con el sitio puedes escribir a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>

      <section>
        <h2>Finalidad del sitio</h2>
        <p>La web permite localizar estaciones, consultar precios comunicados a fuentes oficiales, comparar productos y recoger puntuaciones o confirmaciones estructuradas de personas autenticadas.</p>
        <p>Gasoliguapis no es una estación de servicio, no vende combustible y no representa al Ministerio para la Transición Ecológica y el Reto Demográfico ni a las marcas mostradas.</p>
      </section>

      <section>
        <h2>Exactitud y disponibilidad</h2>
        <p>Los precios, horarios, servicios y estados pueden cambiar. Mostramos la fuente y la fecha disponible, pero la información no constituye una oferta contractual. Antes de realizar un desvío importante conviene confirmar la disponibilidad con la estación.</p>
      </section>

      <section>
        <h2>Uso permitido</h2>
        <p>No se permite utilizar la web para introducir datos falsos, manipular puntuaciones, automatizar votos, interferir con el servicio o presentar sus contenidos como propios. Podemos limitar o retirar contribuciones y cuentas cuando existan indicios razonables de fraude o abuso.</p>
      </section>

      <section>
        <h2>Enlaces y servicios externos</h2>
        <p>Los enlaces de navegación abren servicios externos, como aplicaciones de mapas, bajo las condiciones de sus respectivos proveedores. Gasoliguapis no controla su disponibilidad ni sus políticas.</p>
      </section>
    </GuideShell>
  );
}
