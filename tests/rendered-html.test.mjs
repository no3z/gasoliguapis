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
  assert.match(html, /Gasolineras en ruta/);
  assert.match(html, /CATÁLOGO OFICIAL · MITECO/);
  assert.match(html, /Café rico, baños limpios/);
  assert.match(html, /Tu combustible/);
  assert.match(html, /Tiene GLP/);
  assert.match(html, /Tiene AdBlue/);
  assert.match(html, /calculadora-ahorro-combustible/);
  assert.doesNotMatch(html, /FICHA DE EJEMPLO|opiniones demo|Precios de muestra/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
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

test("keeps product metadata and removes the disposable starter", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /StationExplorer/);
  assert.match(layout, /Gasoliguapis/);
  assert.match(layout, /og\.png/);
  assert.match(layout, /max-image-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../app/robots.ts", import.meta.url));
  await access(new URL("../app/sitemap.ts", import.meta.url));
  await access(new URL("../app/manifest.ts", import.meta.url));
  await access(new URL(".openai/drizzle/0000_right_newton_destine.sql", templateRoot));
});
