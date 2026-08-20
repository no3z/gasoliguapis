import type { Metadata } from "next";
import { notFound } from "next/navigation";
import snapshot from "../../../public/data/miteco-special-fuels.json";
import InternalLink from "../../internal-link";
import { provinceBySlug, PROVINCES } from "../../provinces";
import { DATA_SNAPSHOT_DATE, SITE_URL } from "../../site-config";
import StationExplorer from "../../station-explorer";

type AdblueStation = (typeof snapshot.products.adblue)[number];

function stationsInProvince(officialProvince: string) {
  return snapshot.products.adblue.filter((station) => station.province === officialProvince);
}

function formatPrice(priceMicros: number) {
  return `${(priceMicros / 1_000_000).toLocaleString("es-ES", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} €/l`;
}

export function generateStaticParams() {
  const covered = new Set(snapshot.products.adblue.map((station) => station.province));
  return PROVINCES.filter((province) => covered.has(province.official))
    .map((province) => ({ provincia: province.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provincia: string }>;
}): Promise<Metadata> {
  const { provincia: slug } = await params;
  const province = provinceBySlug(slug);
  if (!province) return {};
  const count = stationsInProvince(province.official).length;

  return {
    title: `Gasolineras con AdBlue en ${province.name}: mapa y precios`,
    description: `Encuentra ${count} gasolineras con AdBlue en ${province.name}, compara precios oficiales y abre la ruta hasta la estación elegida.`,
    alternates: { canonical: `/gasolineras-con-adblue/${province.slug}` },
    openGraph: {
      title: `Gasolineras con AdBlue en ${province.name}`,
      description: `${count} estaciones con precio oficial, mapa y rutas.`,
      url: `/gasolineras-con-adblue/${province.slug}`,
    },
  };
}

export default async function AdblueProvincePage({
  params,
}: {
  params: Promise<{ provincia: string }>;
}) {
  const { provincia: slug } = await params;
  const province = provinceBySlug(slug);
  if (!province) notFound();

  const stations = stationsInProvince(province.official);
  if (stations.length === 0) notFound();

  const orderedStations = [...stations].sort((left, right) => left.priceMicros - right.priceMicros);
  const prices = stations.map((station) => station.priceMicros);
  const averagePrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  const municipalityCounts = new Map<string, number>();
  for (const station of stations) {
    municipalityCounts.set(station.municipality, (municipalityCounts.get(station.municipality) ?? 0) + 1);
  }
  const municipalities = [...municipalityCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "es"));
  const canonicalPath = `/gasolineras-con-adblue/${province.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `Gasolineras con AdBlue en ${province.name}`,
        url: `${SITE_URL}${canonicalPath}`,
        description: `Mapa y comparación de ${stations.length} estaciones con precio oficial de AdBlue en ${province.name}.`,
        inLanguage: "es-ES",
        dateModified: "2026-08-10",
        isPartOf: { "@type": "WebSite", name: "Gasoliguapis", url: SITE_URL },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Gasolineras con AdBlue", item: `${SITE_URL}/gasolineras-con-adblue` },
          { "@type": "ListItem", position: 3, name: province.name, item: `${SITE_URL}${canonicalPath}` },
        ],
      },
    ],
  };

  return (
    <>
      <StationExplorer
        signInPath={`/api/auth/google/start?return_to=${encodeURIComponent(canonicalPath)}`}
        initialFuel="adblue"
        initialProvince={province.official}
        autoLocate={false}
        pageHeading={`Gasolineras con AdBlue en ${province.name}: mapa y precios oficiales`}
      />

      <section className="local-seo" aria-labelledby="local-adblue-heading">
        <nav className="breadcrumbs" aria-label="Migas de pan">
          <InternalLink href="/">Inicio</InternalLink><span>›</span>
          <InternalLink href="/gasolineras-con-adblue">Gasolineras con AdBlue</InternalLink><span>›</span>
          <span aria-current="page">{province.name}</span>
        </nav>

        <header>
          <p>DATOS OFICIALES · {DATA_SNAPSHOT_DATE.toLocaleUpperCase("es-ES")}</p>
          <h2 id="local-adblue-heading">Precios de AdBlue en {province.name}</h2>
          <div>Precios, estaciones y rutas.</div>
        </header>

        <div className="local-stats" aria-label={`Resumen de precios de AdBlue en ${province.name}`}>
          <div><strong>{stations.length}</strong><span>estaciones</span></div>
          <div><strong>{formatPrice(Math.min(...prices))}</strong><span>precio mínimo</span></div>
          <div><strong>{formatPrice(averagePrice)}</strong><span>precio medio</span></div>
          <div><strong>{formatPrice(Math.max(...prices))}</strong><span>precio máximo</span></div>
        </div>

        <section>
          <h3>AdBlue más barato en {province.name}</h3>
          <p>Diez estaciones ordenadas por precio oficial.</p>
          <div className="local-station-list">
            {orderedStations.slice(0, 10).map((station: AdblueStation, index) => (
              <article key={station.id}>
                <span>{index + 1}</span>
                <div><strong>{station.name}</strong><small>{station.address} · {station.municipality}</small></div>
                <b>{formatPrice(station.priceMicros)}</b>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${station.latE6 / 1_000_000},${station.lngE6 / 1_000_000}&travelmode=driving`} target="_blank" rel="noreferrer">Ruta</a>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h3>Municipios con AdBlue publicado</h3>
          <div className="municipality-list">
            {municipalities.map(([municipality, count]) => <span key={municipality}>{municipality} <b>{count}</b></span>)}
          </div>
        </section>

        <aside className="source-note">
          Fuente: MITECO. Datos del {DATA_SNAPSHOT_DATE}. <InternalLink href="/metodologia">Criterios</InternalLink>.
        </aside>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
