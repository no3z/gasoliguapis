import InternalLink from "./internal-link";

export default function NotFound() {
  return (
    <main className="not-found">
      <span>404</span>
      <h1>Página no encontrada</h1>
      <p>La dirección solicitada no está disponible.</p>
      <InternalLink href="/">Ir al buscador</InternalLink>
    </main>
  );
}
