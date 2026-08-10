import { env } from "cloudflare:workers";

type Result<T> = { results?: T[] };
type Prepared = {
  bind: (...values: unknown[]) => Prepared;
  all: <T>() => Promise<Result<T>>;
};
type Database = { prepare: (sql: string) => Prepared };

export async function GET(request: Request) {
  const database = (env as unknown as { DB: Database }).DB;
  const url = new URL(request.url);
  const province = url.searchParams.get("province")?.trim();
  const fuel = url.searchParams.get("fuel")?.trim() || "diesel_a";
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 30)));

  const rows = await database.prepare(`SELECT
      s.id, s.name, s.brand, s.address, s.municipality, s.province,
      s.lat_e6 AS latE6, s.lng_e6 AS lngE6,
      p.price_micros AS priceMicros, p.currency, p.observed_at AS priceObservedAt
    FROM stations s
    LEFT JOIN station_current_prices p
      ON p.station_id = s.id AND p.fuel_type_id = ?
    WHERE s.status = 'active' AND (? IS NULL OR s.province = ?)
    ORDER BY p.price_micros IS NULL, p.price_micros ASC, s.name ASC
    LIMIT ?`).bind(fuel, province || null, province || null, limit).all();

  return Response.json({
    data: rows.results || [],
    attribution: "Origen de los datos: Ministerio para la Transición Ecológica y el Reto Demográfico",
  }, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
}
