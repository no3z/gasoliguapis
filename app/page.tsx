import type { Metadata } from "next";
import StationExplorer from "./station-explorer";
import { SITE_URL } from "./site-config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gasolineras en carretera: precios, GLP, AdBlue y servicios",
  description:
    "Compara precios oficiales MITECO y encuentra gasolineras con GLP, AdBlue, baños cuidados y cafetería en las carreteras de España.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Gasoliguapis",
          url: SITE_URL,
          applicationCategory: "TravelApplication",
          operatingSystem: "Web",
          inLanguage: "es-ES",
          description: "Buscador de gasolineras y paradas en carretera con precios oficiales, GLP, AdBlue y valoraciones de servicios.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        }) }}
      />
      <StationExplorer
        signInPath="/signin-with-chatgpt?return_to=%2F"
      />
    </>
  );
}
