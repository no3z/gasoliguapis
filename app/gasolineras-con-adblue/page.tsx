import type { Metadata } from "next";
import snapshot from "../../public/data/miteco-special-fuels.json";
import GuideShell from "../guide-shell";
import InternalLink from "../internal-link";
import { PROVINCES } from "../provinces";
import { DATA_SNAPSHOT_DATE, SITE_URL } from "../site-config";

export const metadata: Metadata = {
  title: "Gasolineras con AdBlue en España",
  description: "Gasolineras con AdBlue, precios oficiales y rutas por provincia.",
  alternates: { canonical: "/gasolineras-con-adblue" },
  openGraph: { title: "Gasolineras con AdBlue en España", description: "Precios oficiales y rutas por provincia.", url: "/gasolineras-con-adblue" },
};

export default function AdblueGuide() {
  const provinceCounts = new Map<string, number>();
  for (const station of snapshot.products.adblue) {
    provinceCounts.set(station.province, (provinceCounts.get(station.province) ?? 0) + 1);
  }
  const coveredProvinces = PROVINCES
    .map((province) => ({ ...province, count: provinceCounts.get(province.official) ?? 0 }))
    .filter((province) => province.count > 0)
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "es"));
  const lpgStations = new Set(snapshot.products.lpg.map((station) => station.id));
  const bothCount = snapshot.products.adblue.filter((station) => lpgStations.has(station.id)).length;

  return (
    <GuideShell eyebrow="ADBLUE" title="Gasolineras con AdBlue en España" lead="Precios oficiales y rutas por provincia.">
      <section className="guide-stats" aria-label="Cobertura de los datos">
        <div><strong>{snapshot.products.adblue.length.toLocaleString("es-ES")}</strong><span>estaciones con precio AdBlue publicado</span></div>
        <div><strong>{bothCount.toLocaleString("es-ES")}</strong><span>con AdBlue y GLP publicados</span></div>
        <div><strong>€/litro</strong><span>unidad usada para comparar</span></div>
      </section>

      <section>
        <h2>Buscar AdBlue</h2>
        <p>Filtra por provincia, precio, distancia y servicios.</p>
        <InternalLink className="guide-cta" href="/buscar/adblue#explorar">Ver gasolineras con AdBlue</InternalLink>
      </section>

      <section>
        <h2>Gasolineras con AdBlue por provincia</h2>
        <p>Selecciona una provincia para consultar el mapa, los precios y las rutas.</p>
        <div className="province-link-grid">
          {coveredProvinces.map((province) => (
            <InternalLink href={`/gasolineras-con-adblue/${province.slug}`} key={province.slug}>
              <span>{province.name}</span><strong>{province.count}</strong>
            </InternalLink>
          ))}
        </div>
      </section>

      <aside className="source-note">Fuente: <a href="https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/" target="_blank" rel="noreferrer">MITECO</a>. Datos del {DATA_SNAPSHOT_DATE}. <InternalLink href="/metodologia">Criterios</InternalLink>.</aside>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Gasolineras con AdBlue en España",
        description: "Gasolineras con AdBlue, precios oficiales y rutas por provincia.",
        inLanguage: "es-ES",
        dateModified: "2026-08-10",
        mainEntityOfPage: `${SITE_URL}/gasolineras-con-adblue`,
        author: { "@type": "Organization", name: "Gasoliguapis" },
        publisher: { "@type": "Organization", name: "Gasoliguapis", url: SITE_URL },
      }) }} />
    </GuideShell>
  );
}
