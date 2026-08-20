import type { Metadata } from "next";
import GuideShell from "../guide-shell";
import { DATA_SNAPSHOT_DATE } from "../site-config";

export const metadata: Metadata = {
  title: "Fuentes de precios y valoraciones",
  description: "Fuente, fecha y criterios de los precios, servicios y valoraciones.",
  alternates: { canonical: "/metodologia" },
};

export default function MethodologyPage() {
  return (
    <GuideShell eyebrow="FUENTES" title="Precios y valoraciones" lead="Origen, fecha y nivel de confianza de cada dato.">
      <section className="method-steps">
        <div><span>01</span><h2>Precios</h2><p>Fuente oficial: Ministerio para la Transición Ecológica. Cada precio incluye fecha de observación.</p></div>
        <div><span>02</span><h2>Disponibilidad</h2><p>Un precio confirma el producto en esa fecha. La falta de precio se clasifica como dato desconocido.</p></div>
        <div id="valoraciones"><span>03</span><h2>Valoraciones</h2><p>Notas separadas para parada, baños, café y limpieza, siempre con número de votos. El orden utiliza una media ponderada para evitar que un único voto domine el listado.</p></div>
        <div><span>04</span><h2>Confirmaciones</h2><p>Un voto por cuenta y categoría. Sin comentarios públicos. Las confirmaciones de servicios caducan.</p></div>
      </section>

      <section>
        <h2>Datos disponibles</h2>
        <p>{DATA_SNAPSHOT_DATE}: 11.529 estaciones; 1.000 con GLP; 2.929 con AdBlue; 403 con ambos.</p>
        <a className="guide-cta secondary" href="https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/" target="_blank" rel="noreferrer">Fuente oficial</a>
      </section>
    </GuideShell>
  );
}
