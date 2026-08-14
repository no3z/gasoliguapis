# Architecture and product constraints

## Runtime and main surfaces

- Framework: React 19 with Next-compatible routes compiled by vinext for Cloudflare Workers.
- Runtime configuration: `vite.config.ts`, `.openai/hosting.json`, and `cloudflare:workers` bindings.
- Main experience: `app/station-explorer.tsx`, `app/station-map.tsx`, and `app/globals.css`.
- Public identity and canonical constants: `app/site-config.ts`.
- Contact address: `contacto@gasoliguapis.es`.
- Database access: `db/index.ts`; schema: `db/schema.ts`; migrations: `migrations/`.
- Official-station API: `app/api/stations/route.ts`.
- Protected MITECO ingestion: `app/api/internal/sync-miteco/route.ts`.
- D1 binding: `DB`; R2 binding: `MEDIA`.

## Data and community model

- MITECO provides official station identity, location, fuel availability, and prices.
- D1 stores normalized catalogue data, user ratings, confirmations, and application state.
- R2 stores the reusable MITECO snapshot/media binding.
- Ratings are independent 1–5 dimensions such as station/stop, bathrooms, coffee, and cleanliness. Do not collapse them into one invented score.
- Keep one authenticated vote per user, station, and dimension according to the existing route/schema constraints.
- Show aggregate rating and vote count together; avoid ranking tiny samples as confidently as well-supported ratings.
- Do not import Google Maps reviews, photos, or business content. Google OAuth authenticates identity only.

## Product behavior to preserve

- Default fuel is Gasolina 95 and the user's selection persists between visits.
- Map, results, selected station, distance, fuel prices, and ratings remain synchronized.
- A station price panel shows only fuel prices actually available for that station.
- Station panels omit unavailable facts instead of rendering `Sin datos`; service rating chips appear only when they have votes.
- Ratings are the primary community signal. Keep temporary confirmations in a collapsed secondary disclosure, without a floating or prominent confirmation call to action.
- Filters, location, and map fitting must remain usable on small screens.
- No public free-text comments; they would create a moderation burden outside the current product scope.

## SEO and legal surfaces

- Canonical origin: `https://gasoliguapis.es`.
- SEO routes: `app/robots.ts`, `app/sitemap.ts`, page metadata, structured data, GLP province pages, AdBlue, methodology, and fuel-savings calculator.
- Legal routes: `/aviso-legal`, `/privacidad`, and `/cookies`.
- Keep `robots.txt` and the sitemap public and pointed at the custom domain.
- Update legal copy when authentication, measurement, advertising, cookies, or data retention changes.

## Validation map

- `npm test`: production build plus `tests/rendered-html.test.mjs`.
- `npm run lint`: repository-wide lint.
- For API or database changes, inspect the relevant route, schema, and migration together.
- For map/layout changes, test desktop and mobile widths and the empty/loading/error states.
- For production smoke tests, check `/`, `/robots.txt`, `/sitemap.xml`, `/ads.txt`, `/api/config/analytics`, login start/callback behavior, station reads, and an authenticated rating write when credentials are available.
