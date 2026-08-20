import type { Metadata } from "next";
import GuideShell from "../guide-shell";
import { SITE_URL } from "../site-config";
import FuelSavingsCalculator from "./calculator";

export const metadata: Metadata = {
  title: "Calculadora de ahorro de combustible y coste del desvío",
  description: "Calcula si merece la pena desviarte a una gasolinera más barata teniendo en cuenta litros, precio, distancia extra y consumo.",
  alternates: { canonical: "/calculadora-ahorro-combustible" },
  openGraph: { title: "¿Compensa desviarte para repostar más barato?", description: "Calcula el ahorro neto del repostaje después de descontar el combustible del desvío.", url: "/calculadora-ahorro-combustible" },
};

export default function SavingsPage() {
  return (
    <GuideShell eyebrow="CALCULADORA" title="Ahorro de combustible" lead="Calcula el ahorro después de descontar el coste del desvío.">
      <FuelSavingsCalculator />
      <section>
        <h2>Cálculo</h2>
        <p>Diferencia de precio × litros, menos el combustible consumido en el desvío. Los datos permanecen en el dispositivo.</p>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Calculadora de ahorro de combustible",
        url: `${SITE_URL}/calculadora-ahorro-combustible`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        inLanguage: "es-ES",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      }) }} />
    </GuideShell>
  );
}
