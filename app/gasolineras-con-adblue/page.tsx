import type { Metadata } from "next";
import snapshot from "../../public/data/miteco-special-fuels.json";
import GuideShell from "../guide-shell";
import InternalLink from "../internal-link";
import { PROVINCES } from "../provinces";
import { DATA_SNAPSHOT_DATE, SITE_URL } from "../site-config";

export const metadata: Metadata = {
  title: "Gasolineras con AdBlue en España: precio y disponibilidad",
  description: "Busca gasolineras con precio oficial de AdBlue y entiende por qué la ausencia del dato no siempre significa que una estación no lo venda.",
  alternates: { canonical: "/gasolineras-con-adblue" },
  openGraph: { title: "Gasolineras con AdBlue en España", description: "Disponibilidad confirmada, precio oficial y datos transparentes para viajar.", url: "/gasolineras-con-adblue" },
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
    <GuideShell eyebrow="GUÍA PARA DIÉSEL" title="Gasolineras con AdBlue sin falsas certezas" lead="Mostramos cuándo la disponibilidad está confirmada y cuándo simplemente falta información. Esa diferencia evita descartar una parada por error.">
      <section className="guide-stats" aria-label="Cobertura de los datos">
        <div><strong>{snapshot.products.adblue.length.toLocaleString("es-ES")}</strong><span>estaciones con precio AdBlue publicado</span></div>
        <div><strong>{bothCount.toLocaleString("es-ES")}</strong><span>con AdBlue y GLP publicados</span></div>
        <div><strong>3 estados</strong><span>oficial, comunidad o desconocido</span></div>
      </section>

      <section>
        <h2>“Sin dato” no significa “no disponible”</h2>
        <p>La remisión del precio de AdBlue es voluntaria. Por eso interpretamos un precio oficial como disponibilidad confirmada, pero no convertimos una casilla vacía en un “no vende AdBlue”. Puede que la estación lo ofrezca sin haber comunicado el precio.</p>
        <p>La solución es conservar tres estados: confirmado por fuente oficial, confirmado recientemente por la comunidad o el propietario, y desconocido. La interfaz no mezcla esos niveles de confianza.</p>
        <InternalLink className="guide-cta" href="/buscar/adblue#explorar">Abrir el buscador nacional de AdBlue</InternalLink>
      </section>

      <section className="guide-grid">
        <div><h2>Formato de venta</h2><p>Antes de desviarte conviene confirmar si se dispensa en surtidor, garrafa o ambos. Es uno de los datos que la comunidad podrá verificar.</p></div>
        <div><h2>Frescura visible</h2><p>Cada precio oficial se acompaña de su momento de observación. Las verificaciones comunitarias tendrán también fecha de caducidad.</p></div>
      </section>

      <section>
        <h2>Cómo planificar una parada fiable</h2>
        <ol>
          <li>Filtra por AdBlue y por el combustible principal de tu vehículo.</li>
          <li>Comprueba la hora del precio y el horario de la estación.</li>
          <li>Calcula si el precio compensa el desvío y el consumo adicional.</li>
          <li>Consulta la última verificación de surtidor, baños y acceso.</li>
        </ol>
      </section>

      <section>
        <h2>Gasolineras con AdBlue por provincia</h2>
        <p>Entra en una provincia para abrir el mapa ya filtrado, comparar el precio mínimo, medio y máximo y consultar las estaciones con AdBlue más baratas.</p>
        <div className="province-link-grid">
          {coveredProvinces.map((province) => (
            <InternalLink href={`/gasolineras-con-adblue/${province.slug}`} key={province.slug}>
              <span>{province.name}</span><strong>{province.count}</strong>
            </InternalLink>
          ))}
        </div>
      </section>

      <aside className="source-note">Datos procedentes del <a href="https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/" rel="noreferrer">servicio oficial de precios de carburantes</a>. Recuento del {DATA_SNAPSHOT_DATE}. <InternalLink href="/metodologia">Consulta la metodología y sus límites</InternalLink>.</aside>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Gasolineras con AdBlue en España: precio y disponibilidad",
        description: "Guía para interpretar correctamente la disponibilidad y el precio oficial de AdBlue.",
        inLanguage: "es-ES",
        dateModified: "2026-08-10",
        mainEntityOfPage: `${SITE_URL}/gasolineras-con-adblue`,
        author: { "@type": "Organization", name: "Gasoliguapis" },
        publisher: { "@type": "Organization", name: "Gasoliguapis", url: SITE_URL },
      }) }} />
    </GuideShell>
  );
}
