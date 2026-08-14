---
name: maintain-gasoliguapis
description: Maintain, extend, troubleshoot, test, publish, or review the Gasoliguapis repository and production site. Use for work on its Next.js/vinext application, map and station data, ratings, Google OAuth, Analytics, AdSense and Google CMP consent, SEO, Cloudflare D1/R2 bindings, Sites hosting, gasoliguapis.es domain, or GitHub/Sites release workflow.
---

# Maintain Gasoliguapis

Work from the repository root and preserve the existing product: a Spanish, map-first petrol-station finder with authenticated ratings and no public comments.

## Start every task

1. Read `README.md`, `.openai/hosting.json`, `package.json`, and `git status --short --branch`.
2. Inspect only the files relevant to the request. Use `rg` before changing code.
3. Preserve unrelated user changes. Never commit credentials or replace placeholders in `.env.example` with real values.
4. For website implementation or publishing, also read and follow the available `sites-building` and `sites-hosting` skills. The Sites project in `.openai/hosting.json` is authoritative; never create a replacement site.

## Route by task

- Read [references/architecture.md](references/architecture.md) for application structure, data, ratings, SEO, and validation.
- Read [references/google-integrations.md](references/google-integrations.md) before touching Google OAuth, Analytics, AdSense, CMP consent, legal copy, or Google console settings.
- Read [references/release.md](references/release.md) before committing, pushing, deploying, changing hosted environment variables, or diagnosing production.

## Implementation rules

- Keep the experience useful on mobile and desktop; visually inspect when layout behavior changes.
- Treat official MITECO data and community data as distinct sources.
- Require authentication for writes. Keep ratings structured and moderation-light; do not add public free-text comments without explicit approval.
- Keep canonical URLs on `https://gasoliguapis.es`, not the Sites provider URL.
- Keep secrets in hosted environment variables or a local untracked `.env`; keep only names and placeholders in tracked files.
- Update tests and legal/SEO surfaces when an integration changes user-visible behavior or data processing.

## Validate proportionally

Run targeted checks while iterating, then normally run:

```bash
npm test
npm run lint
```

`npm test` already includes the production build. If the full lint reports unrelated pre-existing failures, run ESLint on every changed source file and report both results honestly. Do not weaken tests or lint rules to make a change pass.

## Finish

Review `git diff --check`, `git diff`, and `git status`. Commit only the intended files. Do not deploy unless the user requested publication or the website task clearly includes it. When deploying, complete the Sites workflow through terminal status and verify the custom domain afterward.
