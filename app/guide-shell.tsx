import type { ReactNode } from "react";
import InternalLink from "./internal-link";
import { CONTACT_EMAIL, legalNavigation, primaryNavigation } from "./site-config";

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
        <InternalLink className="guide-brand" href="/" aria-label="Gasoliguapis, volver al buscador">
          <span>G</span> gasoli<i>guapis</i>
        </InternalLink>
        <InternalLink className="guide-search-link" href="/">Abrir buscador</InternalLink>
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
        <div><strong>Gasoliguapis</strong><span>Precios, servicios y rutas.</span><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></div>
        <nav aria-label="Guías útiles">
          {primaryNavigation.map((item) => <InternalLink href={item.href} key={item.href}>{item.label}</InternalLink>)}
          {legalNavigation.map((item) => <InternalLink href={item.href} key={item.href}>{item.label}</InternalLink>)}
        </nav>
      </footer>
    </main>
  );
}
