import type { Metadata } from "next";
import Link from "next/link";
import GuideShell from "../guide-shell";
import { DATA_SNAPSHOT_DATE, SITE_URL } from "../site-config";

export const metadata: Metadata = {
  title: "Gasolineras con AdBlue en España: precio y disponibilidad",
  description: "Busca gasolineras con precio oficial de AdBlue y entiende por qué la ausencia del dato no siempre significa que una estación no lo venda.",
  alternates: { canonical: "/gasolineras-con-adblue" },
  openGraph: { title: "Gasolineras con AdBlue en España", description: "Disponibilidad confirmada, precio oficial y datos transparentes para viajar.", url: "/gasolineras-con-adblue" },
};

export default function AdblueGuide() {
  return (
    <GuideShell eyebrow="GUÍA PARA DIÉSEL" title="Gasolineras con AdBlue sin falsas certezas" lead="Mostramos cuándo la disponibilidad está confirmada y cuándo simplemente falta información. Esa diferencia evita descartar una parada por error.">
      <section className="guide-stats" aria-label="Cobertura de los datos">
        <div><strong>2.928</strong><span>estaciones con precio AdBlue publicado</span></div>
        <div><strong>403</strong><span>con AdBlue y GLP publicados</span></div>
        <div><strong>3 estados</strong><span>oficial, comunidad o desconocido</span></div>
      </section>

      <section>
        <h2>“Sin dato” no significa “no disponible”</h2>
        <p>La remisión del precio de AdBlue es voluntaria. Por eso interpretamos un precio oficial como disponibilidad confirmada, pero no convertimos una casilla vacía en un “no vende AdBlue”. Puede que la estación lo ofrezca sin haber comunicado el precio.</p>
        <p>La solución es conservar tres estados: confirmado por fuente oficial, confirmado recientemente por la comunidad o el propietario, y desconocido. La interfaz no mezcla esos niveles de confianza.</p>
        <Link className="guide-cta" href="/#explorar">Buscar AdBlue en el mapa</Link>
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

      <aside className="source-note">Datos procedentes del <a href="https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/" rel="noreferrer">servicio oficial de precios de carburantes</a>. Recuento del {DATA_SNAPSHOT_DATE}. <Link href="/metodologia">Consulta la metodología y sus límites</Link>.</aside>

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
