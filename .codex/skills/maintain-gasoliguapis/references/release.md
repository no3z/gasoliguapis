# Release and production workflow

## Repositories and hosting

- GitHub remote: `origin` (`no3z/gasoliguapis`).
- Sites source remote: `sites`.
- Sites project ID is stored in `.openai/hosting.json`; treat it as opaque and reuse it exactly.
- The public custom domain is `https://gasoliguapis.es`. A returned `*.chatgpt.site` URL is the provider URL, not the canonical product URL.

Do not create another Sites project for this repository. For site work, read the current `sites-building` and `sites-hosting` skills completely because their packaging and deployment requirements may evolve.

## Before commit

1. Check `git status --short --branch` and preserve unrelated work.
2. Run `npm test` and `npm run lint`, or document proportionate targeted checks.
3. Run `git diff --check` and review the complete diff.
4. Confirm `.env.example` contains placeholders only and no secret appears in the diff.
5. Commit only the intended files with a concise imperative message.

Push GitHub when requested. For a deployment, also push the exact same commit to the `sites` source remote before saving a Sites version. If the Sites Git hostname resolves incorrectly in the execution environment, diagnose DNS read-only and use a temporary per-command curl resolution override to a currently resolved live address; never persist a guessed address in Git configuration.

## Deploy with Sites

1. Read `.openai/hosting.json` and reuse its exact project ID and bindings.
2. Confirm the commit to deploy exists on the Sites source remote.
3. Build the source archive from that exact commit according to the Sites skill; exclude secrets, caches, build output, and `.git`.
4. Save a new Sites version with the exact pushed commit SHA and archive.
5. Deploy that saved version to production only with user authorization.
6. Poll deployment status until `succeeded` or `failed`; do not stop at `pending`, `building`, or `publishing`.
7. On success, verify the custom domain rather than only the provider URL.

## Production smoke checks

Use read-only checks appropriate to the change:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://gasoliguapis.es/
curl -fsSL https://gasoliguapis.es/robots.txt
curl -fsSL https://gasoliguapis.es/sitemap.xml
curl -fsSL https://gasoliguapis.es/ads.txt
curl -fsSL https://gasoliguapis.es/api/config/analytics
```

For OAuth or authenticated writes, test through a real browser/session without exposing cookies or tokens. For consent changes, test accept, reject, manage, and withdrawal behavior. For advertising, remember that tag presence does not imply AdSense approval or guaranteed ad delivery.

## Rollback and failures

- Preserve the failed deployment/version identifiers and failure message.
- Prefer deploying a previously known-good saved Sites version over destructive Git history changes.
- Do not reset or discard the user's work to recover production.
- Report whether failure occurred during build, Sites publication, custom-domain resolution, runtime configuration, or the external Google service.
