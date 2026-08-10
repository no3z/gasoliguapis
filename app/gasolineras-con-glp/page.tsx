import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../guide-shell";
import { DATA_SNAPSHOT_DATE, SITE_URL } from "../site-config";

export const metadata: Metadata = {
  title: "Gasolineras con GLP en España: precios y cómo encontrarlas",
  description: "Encuentra gasolineras con GLP, compara el precio oficial y aprende a planificar una ruta sin depender de listados desactualizados.",
  alternates: { canonical: "/gasolineras-con-glp" },
  openGraph: { title: "Gasolineras con GLP en España", description: "Precios oficiales y una forma más fiable de planificar dónde repostar autogás.", url: "/gasolineras-con-glp" },
};

const facts = [
  ["1.000", "estaciones con precio GLP publicado"],
  ["403", "también publicaban precio de AdBlue"],
  ["€/litro", "unidad usada para comparar"],
];

export default function GlpGuide() {
  return (
    <GuideShell eyebrow="GUÍA DE AUTOGÁS" title="Gasolineras con GLP en España" lead="Consulta el precio oficial antes de salir y combina el filtro de GLP con AdBlue cuando necesites ambos productos en la misma parada.">
      <section className="guide-stats" aria-label="Cobertura de los datos">
        {facts.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </section>

      <section>
        <h2>Una búsqueda basada en disponibilidad confirmada</h2>
        <p>Gasoliguapis utiliza el precio comunicado al Ministerio para confirmar que una estación ofrece GLP. En la consulta realizada el {DATA_SNAPSHOT_DATE}, el conjunto oficial contenía 1.000 estaciones con precio de GLP.</p>
        <p>El precio y la fecha de observación aparecen juntos. Así puedes distinguir un dato oficial reciente de una recomendación de la comunidad y evitar listados donde no está claro cuándo se comprobó por última vez.</p>
        <Link className="guide-cta" href="/#explorar">Buscar una estación con GLP</Link>
      </section>

      <section className="guide-grid">
        <div><h2>Antes de desviarte</h2><p>Compara el ahorro del repostaje con los kilómetros extra. Un precio más bajo puede dejar de compensar si obliga a salir demasiado de la ruta.</p></div>
        <div><h2>GLP y AdBlue juntos</h2><p>Activa los dos requisitos para ver únicamente estaciones con precio publicado de ambos productos. Es especialmente útil en viajes largos o vehículos mixtos.</p></div>
      </section>

      <section>
        <h2>Qué queremos verificar además del precio</h2>
        <ul>
          <li>Acceso desde la autovía, sentido y tiempo real de desvío.</li>
          <li>Horario del surtidor y posibles restricciones de acceso.</li>
          <li>Estado de baños, cafetería, accesibilidad y espacio para familias o campers.</li>
          <li>Fecha y origen de cada comprobación comunitaria.</li>
        </ul>
      </section>

      <aside className="source-note">Datos de precios procedentes del <a href="https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/" rel="noreferrer">servicio oficial de precios de carburantes</a>. Fecha del recuento: {DATA_SNAPSHOT_DATE}. <Link href="/metodologia">Consulta la metodología</Link>.</aside>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Gasolineras con GLP en España",
        description: "Guía para encontrar GLP con precios oficiales y planificar una parada en carretera.",
        inLanguage: "es-ES",
        dateModified: "2026-08-10",
        mainEntityOfPage: `${SITE_URL}/gasolineras-con-glp`,
        author: { "@type": "Organization", name: "Gasoliguapis" },
        publisher: { "@type": "Organization", name: "Gasoliguapis", url: SITE_URL },
      }) }} />
    </GuideShell>
  );
}
