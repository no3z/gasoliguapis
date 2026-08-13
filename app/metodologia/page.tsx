import type { Metadata } from "next";
import GuideShell from "../guide-shell";
import { DATA_SNAPSHOT_DATE } from "../site-config";

export const metadata: Metadata = {
  title: "Metodología: precios, servicios y valoraciones",
  description: "Conoce de dónde salen los precios de Gasoliguapis, cómo tratamos GLP y AdBlue y cómo verificaremos baños, cafetería y accesibilidad.",
  alternates: { canonical: "/metodologia" },
};

export default function MethodologyPage() {
  return (
    <GuideShell eyebrow="TRANSPARENCIA" title="Cada dato debe decir de dónde viene" lead="Gasoliguapis separa precio oficial, verificación comunitaria y contenido editorial. No presentamos una ausencia de información como una certeza.">
      <section className="method-steps">
        <div><span>01</span><h2>Precios oficiales</h2><p>La fuente primaria es el servicio de precios de carburantes del Ministerio para la Transición Ecológica. Conservamos el identificador de la estación, el producto, el precio y el momento de observación.</p></div>
        <div><span>02</span><h2>Disponibilidad</h2><p>Un precio publicado confirma el producto en ese momento. En AdBlue, cuya comunicación puede ser voluntaria, la ausencia de precio se marca como “desconocido”, no como “no disponible”.</p></div>
        <div><span>03</span><h2>Experiencia de parada</h2><p>Mostramos la media real y su número de votos. Al ordenar por «Mejor puntuadas» aplicamos una media ponderada con una referencia inicial de 3,5 y cinco votos: así, una única valoración de cinco estrellas no domina el listado. Conforme llegan votos, el orden se aproxima a la media real.</p></div>
        <div><span>04</span><h2>Comunidad sin comentarios</h2><p>Las personas autenticadas pueden puntuar cada categoría una vez y cambiar su voto. No publicamos comentarios de texto; las confirmaciones rápidas caducan y los datos antiguos pierden confianza.</p></div>
      </section>

      <section>
        <h2>Qué todavía no afirmamos</h2>
        <p>La dirección oficial es texto libre y no proporciona por sí sola una relación fiable con carretera, salida y sentido. Hasta completar el cruce geoespacial con la red viaria, las selecciones por tramo se muestran como aproximaciones y no como navegación exacta.</p>
        <p>Tampoco importamos reseñas ni fotografías de plataformas de terceros. La futura capa comunitaria será propia, moderada y vinculada a una cuenta.</p>
      </section>

      <section>
        <h2>Estado del conjunto de datos</h2>
        <p>En la consulta del {DATA_SNAPSHOT_DATE} se observaron 11.529 estaciones, 1.000 con precio de GLP, 2.928 con precio de AdBlue y 403 con ambos. Estos recuentos son una fotografía, no una promesa de inventario permanente.</p>
        <a className="guide-cta secondary" href="https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/" rel="noreferrer">Consultar la fuente oficial</a>
      </section>
    </GuideShell>
  );
}
