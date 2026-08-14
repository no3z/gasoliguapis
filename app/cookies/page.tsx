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
    <GuideShell eyebrow="COOKIES" title="Política de cookies" lead="Tú decides cómo pueden utilizarse tus datos para analítica y publicidad.">
      <section>
        <h2>Uso actual</h2>
        <p>Gasoliguapis utiliza la plataforma de gestión del consentimiento de Google, certificada para el marco IAB TCF, para mostrar en Europa las opciones «Consentir», «No consentir» y «Gestionar opciones». Antes de recibir tu elección, las señales de almacenamiento publicitario y analítico se establecen como denegadas.</p>
        <p>Cuando decides acceder con Google, Gasoliguapis utiliza cookies técnicas imprescindibles y protegidas para completar el acceso y mantener tu sesión.</p>
      </section>

      <section>
        <h2>Almacenamiento en tu dispositivo</h2>
        <p>La lista de estaciones guardadas utiliza almacenamiento local del navegador con la clave <code>gasoliguapis:favorites</code>. Su finalidad es recordar tus favoritas en ese dispositivo. Puedes borrarla desde la configuración del navegador o retirando las estaciones guardadas.</p>
      </section>

      <section>
        <h2>Analítica opcional</h2>
        <p>Google Analytics 4 solo se carga cuando la señal analítica recibida desde la plataforma de consentimiento lo permite. Lo utilizamos para medir páginas visitadas y acciones agregadas como búsquedas, selección de combustible, uso de cercanía, apertura de rutas o envío de puntuaciones. No enviamos a Analytics las coordenadas obtenidas del navegador, tu correo, tu nombre ni el texto libre del buscador.</p>
        <p>Puedes rechazar la analítica y seguir usando las funciones de la web. Google incorpora un enlace de «Configuración de privacidad y cookies» para revisar o retirar posteriormente la elección.</p>
      </section>

      <section>
        <h2>Servicios externos</h2>
        <p>El mapa carga recursos de OpenFreeMap y los enlaces de ruta pueden abrir Google Maps o Apple Maps. Al abrir o cargar esos servicios se aplican sus propias políticas y pueden recibir datos técnicos de conexión.</p>
      </section>

      <section>
        <h2>Publicidad</h2>
        <p>La web contiene la etiqueta de Google AdSense y se encuentra pendiente o sujeta a la aprobación de Google. Cuando pueda mostrar anuncios, AdSense utilizará la elección comunicada por la plataforma de consentimiento para determinar si corresponde publicidad personalizada, no personalizada o limitada.</p>
      </section>

      <section>
        <h2>Contacto</h2>
        <p>Si tienes preguntas sobre estas tecnologías, escribe a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>

      <aside className="source-note">Última actualización: 14 de agosto de 2026. Las preferencias pueden modificarse desde el enlace de configuración de privacidad y cookies añadido por Google.</aside>
    </GuideShell>
  );
}
