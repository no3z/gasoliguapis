import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Gasoliguapis product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Gasoliguapis — Tu mejor parada en carretera(?: · Gasoliguapis)?<\/title>/i);
  assert.match(html, /¿Dónde paramos/);
  assert.match(html, /CATÁLOGO OFICIAL · MITECO/);
  assert.match(html, /Café rico, baños limpios/);
  assert.match(html, /Tu combustible/);
  assert.match(html, /Tiene GLP/);
  assert.match(html, /Tiene AdBlue/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
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
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL(".openai/drizzle/0000_right_newton_destine.sql", templateRoot));
});
