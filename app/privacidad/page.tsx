import type { Metadata } from "next";
import GuideShell from "../guide-shell";
import { CONTACT_EMAIL } from "../site-config";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo trata Gasoliguapis los datos de cuenta, puntuaciones, confirmaciones y ubicación puntual.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return (
    <GuideShell eyebrow="PRIVACIDAD" title="Política de privacidad" lead="Explicamos qué datos usamos, para qué y cómo puedes ejercer tus derechos.">
      <section>
        <h2>Responsable y contacto</h2>
        <p>El responsable del tratamiento es el titular del proyecto Gasoliguapis. Puedes plantear cualquier consulta o ejercer tus derechos escribiendo a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>

      <section>
        <h2>Qué datos tratamos</h2>
        <ul>
          <li>Si accedes con Google: identificador técnico de usuario, correo verificado y nombre visible cuando esté disponible.</li>
          <li>Las puntuaciones y confirmaciones que envías, junto con la estación, categoría y fecha correspondientes.</li>
          <li>Datos técnicos y registros mínimos necesarios para seguridad, prevención del fraude y funcionamiento del servicio.</li>
          <li>Si aceptas la analítica: páginas visitadas y eventos de uso sin coordenadas, correo, nombre ni texto libre de búsqueda.</li>
          <li>Los mensajes que envíes voluntariamente a la dirección de contacto.</li>
        </ul>
      </section>

      <section>
        <h2>Ubicación y favoritos</h2>
        <p>La ubicación se solicita solo con permiso del navegador para ordenar estaciones cercanas o comprobar puntualmente que una confirmación se realiza cerca de la estación. No guardamos un historial de trayectos ni las coordenadas utilizadas en esa comprobación.</p>
        <p>Las estaciones favoritas se guardan únicamente en el almacenamiento local del dispositivo y no se vinculan a tu cuenta.</p>
      </section>

      <section>
        <h2>Para qué y con qué base</h2>
        <p>Tratamos los datos necesarios para prestar las funciones solicitadas, atribuir un voto por persona y categoría, mantener la integridad de las puntuaciones, responder consultas y proteger la plataforma. Las bases aplicables son la ejecución del servicio solicitado y el interés legítimo en prevenir abuso y garantizar su seguridad.</p>
      </section>

      <section>
        <h2>Destinatarios y proveedores</h2>
        <p>La web utiliza Google para identificar a quienes deciden iniciar sesión y, únicamente tras aceptar la analítica, para medir el uso mediante Google Analytics 4. También utiliza infraestructura de OpenAI Sites y Cloudflare para alojamiento, almacenamiento y seguridad. El mapa puede solicitar recursos técnicos a OpenFreeMap. Estos proveedores pueden recibir datos técnicos necesarios para entregar sus servicios. No vendemos datos personales ni publicamos el correo de las personas que puntúan.</p>
      </section>

      <section>
        <h2>Conservación y derechos</h2>
        <p>Las contribuciones se conservan mientras sean útiles para el servicio o hasta que solicites su supresión, salvo que debamos conservar temporalmente información mínima para atender obligaciones legales o prevenir fraude. Puedes solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad escribiendo a {CONTACT_EMAIL}. También puedes reclamar ante la Agencia Española de Protección de Datos.</p>
      </section>

      <aside className="source-note">Última actualización: 14 de agosto de 2026. Esta política se actualizará antes de activar publicidad o nuevas finalidades de medición.</aside>
    </GuideShell>
  );
}
