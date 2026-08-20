import InternalLink from "./internal-link";

export default function NotFound() {
  return (
    <main className="not-found">
      <span>404</span>
      <h1>Esta salida no existe</h1>
      <p>Vuelve al buscador para encontrar una parada que sí merezca la pena.</p>
      <InternalLink href="/">Buscar gasolineras</InternalLink>
    </main>
  );
}
