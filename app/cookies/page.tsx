import type { Metadata } from "next";
import GuideShell from "../guide-shell";
import { CONTACT_EMAIL } from "../site-config";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Cookies y almacenamiento local utilizados actualmente por Gasoliguapis.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <GuideShell eyebrow="COOKIES" title="Política de cookies" lead="Gasoliguapis utiliza actualmente solo el almacenamiento necesario para sus funciones básicas.">
      <section>
        <h2>Uso actual</h2>
        <p>La web no tiene actualmente etiquetas publicitarias ni analítica publicitaria. Cuando decides acceder con Google, Gasoliguapis utiliza cookies técnicas imprescindibles y protegidas para completar el acceso y mantener tu sesión.</p>
      </section>

      <section>
        <h2>Almacenamiento en tu dispositivo</h2>
        <p>La lista de estaciones guardadas utiliza almacenamiento local del navegador con la clave <code>gasoliguapis:favorites</code>. Su finalidad es recordar tus favoritas en ese dispositivo. Puedes borrarla desde la configuración del navegador o retirando las estaciones guardadas.</p>
      </section>

      <section>
        <h2>Servicios externos</h2>
        <p>El mapa carga recursos de OpenFreeMap y los enlaces de ruta pueden abrir Google Maps o Apple Maps. Al abrir o cargar esos servicios se aplican sus propias políticas y pueden recibir datos técnicos de conexión.</p>
      </section>

      <section>
        <h2>Publicidad futura</h2>
        <p>Antes de activar AdSense u otra publicidad, incorporaremos una plataforma de consentimiento certificada que permita aceptar, rechazar o configurar las finalidades no necesarias. Los anuncios no se cargarán en contra de la elección aplicable del usuario.</p>
      </section>

      <section>
        <h2>Contacto</h2>
        <p>Si tienes preguntas sobre estas tecnologías, escribe a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>

      <aside className="source-note">Última actualización: 14 de agosto de 2026.</aside>
    </GuideShell>
  );
}
