# Google integrations

## Public identifiers and secret boundaries

- Production domain: `https://gasoliguapis.es`.
- Contact: `contacto@gasoliguapis.es`.
- GA4 measurement ID: `G-EVV7W93784`.
- AdSense publisher ID: `ca-pub-2200141171782855`.
- OAuth callback: `https://gasoliguapis.es/api/auth/google/callback`.
- Never store the OAuth client secret, session secret, or ingestion secret in Git. `.env.example` must contain placeholders only.

Hosted variables required by the application:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
SESSION_SECRET
GA_MEASUREMENT_ID
INGEST_SECRET
```

Manage production values through Sites environment-variable tooling. Do not echo secret values into tool output or copy them into documentation.

## Google OAuth

Relevant files:

- `app/google-auth.ts`
- `app/api/auth/google/start/route.ts`
- `app/api/auth/google/callback/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/me/route.ts`

Current flow uses Authorization Code with PKCE, `state`, scopes `openid email profile`, verified Google email, signed HttpOnly/Secure/SameSite=Lax session cookies, and a 30-day session. Preserve open-redirect protection in `safeReturnTo`.

Google Auth Platform must use an External audience for public users. Configure the exact production callback above; while the app is in testing, add explicit test users. A production launch may require completing Google's branding/audience publication flow. Never invent callback URLs or add the Sites provider hostname unless intentionally supporting it.

When OAuth fails, verify in order:

1. Hosted variables exist and `SESSION_SECRET` is at least 32 bytes.
2. The configured redirect URI matches the Google client exactly, including scheme and path.
3. The domain and callback resolve publicly over HTTPS.
4. Google audience/testing status permits the account.
5. Start, callback, token exchange, verified profile, and session-cookie stages.

## Analytics and consent

Relevant files:

- `app/analytics.tsx`
- `app/api/config/analytics/route.ts`
- `app/layout.tsx`
- `app/cookies/page.tsx`
- `app/privacidad/page.tsx`

The hosted `GA_MEASUREMENT_ID` is returned through `/api/config/analytics`; do not hardcode a secret-like runtime configuration path elsewhere. Consent defaults to denied for analytics and advertising. The Google-certified AdSense CMP exposes TCF v2 through `window.__tcfapi`; Analytics loads only after consent (or when GDPR does not apply). Page views are sent manually because `send_page_view` is false. Custom events must use `trackAnalyticsEvent`, which refuses to send without analytics consent.

Do not restore the removed custom analytics banner while Google CMP is active. Keep consent revocable through Google's privacy/cookie settings mechanism. Policy pages intentionally avoid loading the advertising/measurement component.

After consent changes, verify acceptance and rejection paths, no duplicate banners, no GA cookies after rejection, route-change page views after acceptance, and the Spanish CMP presentation.

## AdSense and CMP

- Publisher constant: `ADSENSE_ACCOUNT` in `app/site-config.ts`.
- Account meta tag: `app/layout.tsx`.
- AdSense loader and consent defaults: `app/analytics.tsx`.
- Publisher declaration: `public/ads.txt`.

The repository currently installs the general AdSense tag but defines no fixed `<ins class="adsbygoogle">` slots. Placement therefore depends on AdSense Auto ads configured in the AdSense console after site approval. Console-only choices such as anchor, side rail, vignette, in-page formats, page exclusions, and excluded areas are not represented in Git; inspect them before promising exact ad locations.

The Google CMP is configured with Consent, Do not consent, and Manage options; Spanish is the default, and consent mode covers advertising and analytics. If this console configuration changes, keep the legal pages and `app/analytics.tsx` behavior aligned.

Production checks:

```text
GET /ads.txt
  google.com, pub-2200141171782855, DIRECT, f08c47fec0942fa0

GET /api/config/analytics
  {"measurementId":"G-EVV7W93784"}
```

Also inspect the deployed analytics JavaScript chunk for `pagead2.googlesyndication.com`, `__tcfapi`, and the publisher ID. Ads may still be absent until AdSense approves the site and Auto ads or manual units are enabled.
