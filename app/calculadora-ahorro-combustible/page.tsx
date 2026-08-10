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
    <GuideShell eyebrow="HERRAMIENTA GRATUITA" title="Calculadora de ahorro de combustible" lead="El precio más bajo no siempre es la parada más barata. Introduce los datos de tu viaje y descuenta el coste real del desvío.">
      <FuelSavingsCalculator />
      <section>
        <h2>Cómo calculamos el resultado</h2>
        <p>Primero multiplicamos la diferencia de precio por los litros que vas a repostar. Después estimamos el combustible consumido en los kilómetros extra y restamos ese coste al ahorro del surtidor.</p>
        <p>En la aplicación completa añadiremos también el tiempo de desvío, el tráfico y las siguientes alternativas de la ruta. El cálculo se realiza en tu dispositivo: no enviamos ni guardamos estos datos.</p>
      </section>
      <section className="guide-grid">
        <div><h2>Cuándo suele compensar</h2><p>Cuantos más litros repostas y mayor es la diferencia de precio, más margen tienes para asumir un pequeño desvío.</p></div>
        <div><h2>Cuándo no compensa</h2><p>Con depósitos pequeños, consumo alto o muchos kilómetros extra, una oferta llamativa puede acabar costando más.</p></div>
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
