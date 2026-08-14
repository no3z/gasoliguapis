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
    <GuideShell eyebrow="COOKIES" title="Política de cookies" lead="Tú decides si Gasoliguapis puede utilizar analítica para mejorar el servicio.">
      <section>
        <h2>Uso actual</h2>
        <p>La web no tiene actualmente etiquetas publicitarias. Cuando decides acceder con Google, Gasoliguapis utiliza cookies técnicas imprescindibles y protegidas para completar el acceso y mantener tu sesión.</p>
      </section>

      <section>
        <h2>Almacenamiento en tu dispositivo</h2>
        <p>La lista de estaciones guardadas utiliza almacenamiento local del navegador con la clave <code>gasoliguapis:favorites</code>. Su finalidad es recordar tus favoritas en ese dispositivo. Puedes borrarla desde la configuración del navegador o retirando las estaciones guardadas.</p>
      </section>

      <section>
        <h2>Analítica opcional</h2>
        <p>Solo si pulsas «Aceptar analítica» se carga Google Analytics 4. Lo utilizamos para medir páginas visitadas y acciones agregadas como búsquedas, selección de combustible, uso de cercanía, apertura de rutas o envío de puntuaciones. No enviamos a Analytics las coordenadas obtenidas del navegador, tu correo, tu nombre ni el texto libre del buscador.</p>
        <p>Puedes rechazarla y seguir usando todas las funciones. La opción «Privacidad» permite revisar la elección; al retirar el consentimiento comunicamos la denegación a Google y eliminamos las cookies analíticas accesibles desde la web.</p>
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

      <aside className="source-note">Última actualización: 14 de agosto de 2026. Analytics permanece bloqueado hasta recibir una elección afirmativa.</aside>
    </GuideShell>
  );
}
