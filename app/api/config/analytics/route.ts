import { env } from "cloudflare:workers";

export async function GET() {
  const rawId = (env as unknown as { GA_MEASUREMENT_ID?: string }).GA_MEASUREMENT_ID?.trim() || "";
  const measurementId = /^G-[A-Z0-9]+$/i.test(rawId) ? rawId.toUpperCase() : null;
  return Response.json({ measurementId }, { headers: { "cache-control": "public, max-age=300" } });
}
