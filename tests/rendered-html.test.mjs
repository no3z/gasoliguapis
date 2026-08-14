import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Gasoliguapis product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Gasolineras en carretera: precios, GLP, AdBlue y servicios \| Gasoliguapis<\/title>/i);
  assert.match(html, /Encuentra tu/);
  assert.match(html, /CATÁLOGO OFICIAL · MITECO/);
  assert.match(html, /Combustible, servicios y puntuaciones/);
  assert.match(html, /Tu combustible/);
  assert.match(html, /aria-pressed="true"[^>]*>[^<]*(?:<[^>]+>)*95/i);
  assert.doesNotMatch(html, /Tiene GLP|Tiene AdBlue|Debe tener GLP|Debe tener AdBlue/);
  assert.match(html, /Toda España/);
  assert.match(html, /Cerca de mí/);
  assert.match(html, /Más baratas/);
  assert.match(html, /Mejor puntuadas/);
  assert.match(html, /MAPA NACIONAL DE PARADAS/);
  assert.match(html, /Cafetería/);
  assert.match(html, /calculadora-ahorro-combustible/);
  assert.doesNotMatch(html, /FICHA DE EJEMPLO|opiniones demo|Precios de muestra/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("opens a dedicated national GLP search without falling back to diesel", async () => {
  const response = await render("/buscar/glp");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Buscador nacional de gasolineras con GLP/);
  assert.match(html, /aria-pressed="true"[^>]*>[^<]*(?:<[^>]+>)*GLP/i);
  assert.match(html, /Búsqueda nacional en toda España/);
});

test("renders useful indexable GLP and savings pages", async () => {
  const [glpResponse, calculatorResponse] = await Promise.all([
    render("/gasolineras-con-glp"),
    render("/calculadora-ahorro-combustible"),
  ]);
  assert.equal(glpResponse.status, 200);
  assert.equal(calculatorResponse.status, 200);
  const glpHtml = await glpResponse.text();
  const calculatorHtml = await calculatorResponse.text();
  assert.match(glpHtml, /Gasolineras con GLP en España/);
  assert.match(glpHtml, /application\/ld\+json/);
  assert.match(calculatorHtml, /¿Compensa salir de la ruta\?/);
  assert.match(calculatorHtml, /El cálculo se realiza en tu dispositivo/);
});

test("renders useful province-level GLP pages and lists them in the sitemap", async () => {
  const [provinceResponse, sitemapResponse] = await Promise.all([
    render("/gasolineras-con-glp/madrid"),
    render("/sitemap.xml"),
  ]);
  assert.equal(provinceResponse.status, 200);
  assert.equal(sitemapResponse.status, 200);
  const provinceHtml = await provinceResponse.text();
  const sitemapXml = await sitemapResponse.text();
  assert.match(provinceHtml, /Gasolineras con GLP en Madrid: mapa y precios oficiales/);
  assert.match(provinceHtml, /Precios de GLP en (?:<!-- -->)?Madrid/);
  assert.match(provinceHtml, /precio mínimo/);
  assert.match(provinceHtml, /GLP más barato en (?:<!-- -->)?Madrid/);
  assert.match(sitemapXml, /gasolineras-con-glp\/madrid/);
  assert.match(sitemapXml, /gasolineras-con-glp\/barcelona/);
});

test("publishes contact, privacy and cookie information for consent-managed advertising", async () => {
  const [homeResponse, privacyResponse, cookiesResponse] = await Promise.all([
    render("/"),
    render("/privacidad"),
    render("/cookies"),
  ]);
  const [homeHtml, privacyHtml, cookiesHtml] = await Promise.all([
    homeResponse.text(), privacyResponse.text(), cookiesResponse.text(),
  ]);
  assert.match(homeHtml, /contacto@gasoliguapis\.es/);
  assert.match(homeHtml, /aviso-legal/);
  assert.match(privacyHtml, /No guardamos un historial de trayectos/);
  assert.match(privacyHtml, /Agencia Española de Protección de Datos/);
  assert.match(privacyHtml, /Google Analytics 4 y mostrar publicidad mediante AdSense/);
  assert.match(cookiesHtml, /plataforma de gestión del consentimiento de Google/i);
  assert.match(cookiesHtml, /etiqueta de Google AdSense/i);
});

test("keeps product metadata and removes the disposable starter", async () => {
  const [page, layout, stationExplorer, analytics, analyticsConfig, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/station-explorer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/analytics.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/config/analytics/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /StationExplorer/);
  assert.match(layout, /Gasoliguapis/);
  assert.match(layout, /SITE_URL/);
  assert.match(layout, /og\.png/);
  assert.match(layout, /max-image-preview/);
  assert.match(stationExplorer, /Continuar con Google/);
  assert.match(layout, /GooglePrivacyMeasurement/);
  assert.match(analytics, /analytics_storage: "denied"/);
  assert.match(analytics, /ad_personalization: "denied"/);
  assert.match(analytics, /pagead2\.googlesyndication\.com/);
  assert.match(analytics, /__tcfapi/);
  assert.match(analytics, /tcloaded/);
  assert.match(analytics, /POLICY_PATHS/);
  assert.doesNotMatch(analytics, /Aceptar analítica|analytics-consent/);
  assert.match(analytics, /gasoliguapisAnalyticsConsent !== true/);
  assert.match(analyticsConfig, /GA_MEASUREMENT_ID/);
  assert.doesNotMatch(stationExplorer, /Continuar con ChatGPT|Facebook/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../app/robots.ts", import.meta.url));
  await access(new URL("../app/sitemap.ts", import.meta.url));
  await access(new URL("../app/manifest.ts", import.meta.url));
  await access(new URL(".openai/drizzle/0000_right_newton_destine.sql", templateRoot));
  await access(new URL("../dist/.openai/drizzle/0000_right_newton_destine.sql", import.meta.url));
  const packagedMigrations = JSON.parse(await readFile(new URL("../dist/.openai/drizzle/meta/_journal.json", import.meta.url), "utf8"));
  assert.equal(packagedMigrations.entries.length, 3);
});

test("publishes crawlable SEO files on the custom domain", async () => {
  const [robotsResponse, sitemapResponse] = await Promise.all([
    render("/robots.txt"),
    render("/sitemap.xml"),
  ]);
  assert.equal(robotsResponse.status, 200);
  assert.equal(sitemapResponse.status, 200);
  const [robots, sitemap] = await Promise.all([robotsResponse.text(), sitemapResponse.text()]);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/gasoliguapis\.es\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/gasoliguapis\.es<\/loc>/);
  assert.doesNotMatch(robots, /no3s\.chatgpt\.site/);
  assert.doesNotMatch(sitemap, /no3s\.chatgpt\.site/);
});

test("publishes AdSense ownership verification without loading advertising", async () => {
  const [homeResponse, adsTxt] = await Promise.all([
    render("/"),
    readFile(new URL("../public/ads.txt", import.meta.url), "utf8"),
  ]);
  const homeHtml = await homeResponse.text();
  assert.match(homeHtml, /<meta name="google-adsense-account" content="ca-pub-2200141171782855"\s*\/?\s*>/i);
  assert.match(adsTxt, /^google\.com, pub-2200141171782855, DIRECT, f08c47fec0942fa0\s*$/);
  assert.doesNotMatch(homeHtml, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/);
});

test("keeps ratings structured and does not expose a public comment flow", async () => {
  const [explorer, stationsApi, personalRatingsApi, methodology] = await Promise.all([
    readFile(new URL("../app/station-explorer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/stations/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/me/ratings/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/metodologia/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(explorer, /Sin comentarios públicos/);
  assert.match(explorer, /cada categoría admite un voto por usuario/);
  assert.match(explorer, /Confianza alta/);
  assert.match(explorer, /La media visible es la real/);
  assert.match(stationsApi, /overallRankScore/);
  assert.match(stationsApi, /\+ 17\.5/);
  assert.match(personalRatingsApi, /dimension_id IN \('overall', 'bathroom', 'coffee', 'cleanliness'\)/);
  assert.match(methodology, /media ponderada/);
  assert.doesNotMatch(explorer, /textarea|submitComment|reviewBody/);
});

test("ships a compact official fallback for special fuels", async () => {
  const snapshot = JSON.parse(await readFile(new URL("../public/data/miteco-special-fuels.json", import.meta.url), "utf8"));
  assert.equal(snapshot.source, "MITECO");
  assert.equal(snapshot.products.lpg.length, 1000);
  assert.ok(snapshot.products.adblue.length >= 2900);
  assert.match(snapshot.products.lpg[0].id, /^miteco:/);
  assert.ok(snapshot.products.lpg.every((station) => Number.isInteger(station.priceMicros) && station.priceMicros > 0));
});

test("ships temporary community confirmations without persisting location", async () => {
  const [explorer, confirmationApi, schema, migration] = await Promise.all([
    readFile(new URL("../app/station-explorer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/stations/[stationId]/confirmations/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/drizzle/0002_classy_iron_man.sql", import.meta.url), "utf8"),
  ]);
  assert.match(explorer, /Confirmar GLP, AdBlue o servicios/);
  assert.match(explorer, /Nuestra propuesta cerca de ti/i);
  assert.match(explorer, /Tu ubicación no se guarda/);
  assert.match(confirmationApi, /proximityVerified/);
  assert.doesNotMatch(schema, /latitude|longitude|accuracy/i);
  assert.match(migration, /station_confirmation_summaries/);
});

test("connects the filtered station list to an interactive map", async () => {
  const [map, explorer, stationsApi, packageJson, css] = await Promise.all([
    readFile(new URL("../app/station-map.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/station-explorer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/stations/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(packageJson, /maplibre-gl/);
  assert.match(map, /tiles\.openfreemap\.org\/styles\/liberty/);
  assert.match(map, /flyTo/);
  assert.match(map, /setPerspectiveMode/);
  assert.match(map, /map-toolbar/);
  assert.match(map, /mappableStations/);
  assert.match(map, /fitVisibleStations/);
  assert.match(map, /lastFittedKeyRef/);
  assert.match(map, /offset: \[0, -7\]/);
  assert.match(map, /className="map-viewport"/);
  assert.match(map, /map-viewport[\s\S]*map-toolbar[\s\S]*<\/div>\s*\{selectedStation/);
  assert.match(css, /\.map-station-marker \{[^}]*position: absolute;/);
  assert.doesNotMatch(css, /\.map-station-marker \{[^}]*position: relative;/);
  assert.match(map, /onRequestLocation/);
  assert.match(map, /Buscar en esta zona/);
  assert.match(map, /getBounds/);
  assert.doesNotMatch(map, /map\.on\("error"/);
  assert.match(explorer, /Ver en mapa/);
  assert.match(explorer, /Google Maps/);
  assert.match(explorer, /Apple Maps/);
  assert.match(explorer, /orderedOfficialStations/);
  assert.match(explorer, /selectedDistanceKm/);
  assert.match(explorer, /search-section/);
  assert.match(explorer, /enableHighAccuracy: true/);
  assert.match(explorer, /Seleccionada \+ cercanas/);
  assert.match(explorer, /km de la seleccionada/);
  assert.match(explorer, /serviceFilters/);
  assert.match(explorer, /personalRatings/);
  assert.match(explorer, /MAP_STATION_LIMIT = 8/);
  assert.match(explorer, /mapStations/);
  assert.match(explorer, /activeSpecialFuel \? DEFAULT_FUEL : nextFuel/);
  assert.match(explorer, /refitKey=\{fuel\}/);
  assert.match(explorer, /gasoliguapis:favorites/);
  assert.match(explorer, /gasoliguapis:fuel/);
  assert.match(explorer, /GUARDADAS EN ESTE DISPOSITIVO/);
  assert.match(explorer, /Confirmar datos/);
  assert.match(explorer, /radiusOptions/);
  assert.match(explorer, /Radio desde mí/);
  assert.match(explorer, /Valoradas por mí/);
  assert.doesNotMatch(explorer, /Abierto 24 h.*pronto|Duchas.*pronto/);
  assert.match(map, /map-marker-user-rating/);
  assert.match(map, /map-marker-public-rating/);
  assert.match(map, /visiblePublicRatingCount/);
  assert.match(explorer, /Media de la comunidad/);
  assert.match(explorer, /rating-stars-display/);
  assert.match(explorer, /advanceRatingFlow/);
  assert.match(explorer, /Paso \{ratingOptions\.findIndex/);
  assert.match(explorer, /Al tocar una estrella pasas al siguiente paso/);
  assert.match(explorer, /trackAnalyticsEvent\("get_directions"/);
  assert.match(explorer, /trackAnalyticsEvent\("rate_station"/);
  assert.match(explorer, /trackAnalyticsEvent\("use_location"/);
  assert.match(map, /radiusKm/);
  assert.match(css, /rating-low/);
  assert.match(css, /rating-mid/);
  assert.match(css, /rating-high/);
  assert.match(css, /\.map-viewport \{[^}]*height: clamp\(390px, 58dvh, 520px\)/);
  assert.match(css, /\.map-stage\.advanced \.map-viewport \{[^}]*height: clamp\(500px, 66dvh, 620px\)/);
  assert.match(css, /\.map-selection \{[^}]*position: relative;/);
  assert.doesNotMatch(css, /\.map-stage\.advanced \{[^}]*height: calc\(100dvh/);
  assert.match(stationsApi, /sortParam === "rating"/);
  assert.match(stationsApi, /hasMapBounds/);
  assert.match(stationsApi, /kind: "map"/);
  assert.match(stationsApi, /restaurant_check\.latest_status/);
});
