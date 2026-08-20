import type { Metadata } from "next";
import StationExplorer from "./station-explorer";
import { SITE_URL } from "./site-config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Buscador de gasolineras GLP y AdBlue con valoraciones",
  description:
    "Encuentra gasolineras con GLP y AdBlue, compara precios oficiales de MITECO y consulta o añade puntuaciones de la parada, baños, café y limpieza.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: "Gasoliguapis",
              url: SITE_URL,
              inLanguage: "es-ES",
              description: "Buscador de gasolineras con GLP y AdBlue y puntuaciones de la comunidad.",
            },
            {
              "@type": "WebApplication",
              "@id": `${SITE_URL}/#app`,
              name: "Gasoliguapis",
              url: SITE_URL,
              isPartOf: { "@id": `${SITE_URL}/#website` },
              applicationCategory: "TravelApplication",
              operatingSystem: "Web",
              inLanguage: "es-ES",
              description: "Buscador de gasolineras con precios oficiales de GLP y AdBlue y valoraciones separadas de parada, baños, café y limpieza.",
              featureList: [
                "Búsqueda de gasolineras con GLP",
                "Búsqueda de gasolineras con AdBlue",
                "Comparación de precios oficiales de MITECO",
                "Puntuaciones de parada, baños, café y limpieza",
              ],
              offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
            },
          ],
        }) }}
      />
      <StationExplorer
        signInPath="/api/auth/google/start?return_to=%2F"
      />
    </>
  );
}
