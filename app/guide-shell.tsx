import Link from "next/link";
import type { ReactNode } from "react";
import { primaryNavigation } from "./site-config";

export default function GuideShell({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <main className="guide-shell">
      <header className="guide-nav">
        <Link className="guide-brand" href="/" aria-label="Gasoliguapis, volver al buscador">
          <span>G</span> gasoli<i>guapis</i>
        </Link>
        <Link className="guide-search-link" href="/">Abrir buscador</Link>
      </header>

      <article>
        <header className="guide-hero">
          <p>{eyebrow}</p>
          <h1>{title}</h1>
          <div>{lead}</div>
        </header>
        <div className="guide-content">{children}</div>
      </article>

      <footer className="guide-footer">
        <div><strong>Gasoliguapis</strong><span>Decide dónde merece la pena parar.</span></div>
        <nav aria-label="Guías útiles">
          {primaryNavigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
      </footer>
    </main>
  );
}
