import { env } from "cloudflare:workers";

type Prepared = {
  bind: (...values: unknown[]) => Prepared;
  run: () => Promise<unknown>;
};

type Database = {
  prepare: (sql: string) => Prepared;
  batch: (statements: Prepared[]) => Promise<unknown>;
};

type RuntimeEnv = {
  DB: Database;
  INGEST_SECRET?: string;
};

type OfficialStation = Record<string, string>;

const ENDPOINT = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/";
const FUELS = [
  ["gasoline_95_e5", "Gasolina 95 E5", "Precio Gasolina 95 E5"],
  ["gasoline_98_e5", "Gasolina 98 E5", "Precio Gasolina 98 E5"],
  ["diesel_a", "Gasóleo A", "Precio Gasoleo A"],
  ["diesel_premium", "Gasóleo Premium", "Precio Gasoleo Premium"],
  ["lpg", "GLP", "Precio Gases licuados del petróleo"],
  ["adblue", "AdBlue", "Precio Adblue"],
  ["cng", "GNC", "Precio Gas Natural Comprimido"],
  ["lng", "GNL", "Precio Gas Natural Licuado"],
  ["hydrogen", "Hidrógeno", "Precio Hidrogeno"],
] as const;

function priceDecimal(value?: string) {
  if (!value) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function coordinate(value?: string) {
  if (!value) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function officialDate(value?: string) {
  if (!value) return Date.now();
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return Date.now();
  return Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4]), Number(match[5]), Number(match[6]));
}

export async function POST(request: Request) {
  const runtime = env as unknown as RuntimeEnv;
  const authorization = request.headers.get("authorization");
  if (!runtime.INGEST_SECRET || authorization !== `Bearer ${runtime.INGEST_SECRET}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));
  const limit = Math.min(300, Math.max(1, Number(url.searchParams.get("limit") || 250)));
  const response = await fetch(ENDPOINT, { headers: { accept: "application/json" } });
  if (!response.ok) return Response.json({ error: "La fuente oficial no respondió", status: response.status }, { status: 502 });

  const payload = await response.json() as { Fecha?: string; ListaEESSPrecio?: OfficialStation[] };
  const allStations = payload.ListaEESSPrecio || [];
  const selected = allStations.slice(offset, offset + limit);
  const observedAt = officialDate(payload.Fecha);
  const now = Date.now();

  await runtime.DB.batch([
    runtime.DB.prepare(`INSERT OR IGNORE INTO data_sources
      (id, name, kind, url, attribution, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(
        "miteco-prices", "MITECO · Geoportal de gasolineras", "official", ENDPOINT,
        "Origen de los datos: Ministerio para la Transición Ecológica y el Reto Demográfico", 100, now, now,
      ),
    ...FUELS.map(([code, name]) => runtime.DB.prepare(`INSERT OR IGNORE INTO fuel_types
      (id, code, display_name, unit) VALUES (?, ?, ?, 'litre')`).bind(code, code, name)),
  ]);

  let pricesWritten = 0;
  for (const batchStart of Array.from({ length: Math.ceil(selected.length / 8) }, (_, index) => index * 8)) {
    const statements: Prepared[] = [];
    for (const station of selected.slice(batchStart, batchStart + 8)) {
      const officialId = station.IDEESS;
      const lat = coordinate(station.Latitud);
      const lng = coordinate(station["Longitud (WGS84)"]);
      if (!officialId || lat === null || lng === null) continue;
      const stationId = `miteco:${officialId}`;
      const geoCell = `${lat.toFixed(1)}:${lng.toFixed(1)}`;
      statements.push(runtime.DB.prepare(`INSERT INTO stations
        (id, official_id, name, brand, operator, address, municipality, province, postal_code,
         lat_e6, lng_e6, geo_cell, status, source_updated_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
        ON CONFLICT(official_id) DO UPDATE SET
          name=excluded.name, brand=excluded.brand, operator=excluded.operator,
          address=excluded.address, municipality=excluded.municipality, province=excluded.province,
          postal_code=excluded.postal_code, lat_e6=excluded.lat_e6, lng_e6=excluded.lng_e6,
          geo_cell=excluded.geo_cell, status='active', source_updated_at=excluded.source_updated_at,
          updated_at=excluded.updated_at`).bind(
            stationId, officialId, station.Rótulo || "Estación de servicio", station.Rótulo || null,
            station.Rótulo || null, station.Dirección || null, station.Municipio || null,
            station.Provincia || null, station["C.P."] || null,
            Math.round(lat * 1_000_000), Math.round(lng * 1_000_000), geoCell, observedAt, now, now,
          ));

      // Replace the complete official price snapshot for this station so a
      // product that disappears from the feed never remains as a stale match.
      statements.push(runtime.DB.prepare(`DELETE FROM station_current_prices
        WHERE station_id = ? AND source_id = 'miteco-prices'`).bind(stationId));

      for (const [fuelId, , sourceField] of FUELS) {
        const price = priceDecimal(station[sourceField]);
        if (price === null || price <= 0) continue;
        pricesWritten += 1;
        statements.push(runtime.DB.prepare(`INSERT INTO station_current_prices
          (station_id, fuel_type_id, price_micros, currency, source_id, observed_at)
          VALUES (?, ?, ?, 'EUR', 'miteco-prices', ?)
          ON CONFLICT(station_id, fuel_type_id) DO UPDATE SET
            price_micros=excluded.price_micros, source_id=excluded.source_id, observed_at=excluded.observed_at
          WHERE excluded.observed_at >= station_current_prices.observed_at`).bind(
            stationId, fuelId, Math.round(price * 1_000_000), observedAt,
          ));
      }
    }
    if (statements.length) await runtime.DB.batch(statements);
  }

  const nextOffset = offset + selected.length;
  return Response.json({
    sourceUpdatedAt: new Date(observedAt).toISOString(),
    total: allStations.length,
    processed: selected.length,
    pricesWritten,
    nextOffset: nextOffset < allStations.length ? nextOffset : null,
  });
}
