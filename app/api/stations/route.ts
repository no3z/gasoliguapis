import { env } from "cloudflare:workers";

type Result<T> = { results?: T[] };
type Prepared = {
  bind: (...values: unknown[]) => Prepared;
  all: <T>() => Promise<Result<T>>;
};
type Database = { prepare: (sql: string) => Prepared };

const ALLOWED_FUELS = new Set(["diesel_a", "gasoline_95_e5", "gasoline_98_e5", "diesel_premium", "lpg", "adblue", "cng", "lng", "hydrogen"]);
const MITECO_PRODUCT_ENDPOINT = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroProducto";
const PRODUCT_IDS: Record<string, string> = {
  gasoline_95_e5: "1",
  gasoline_98_e5: "3",
  diesel_a: "4",
  diesel_premium: "5",
  lpg: "17",
  cng: "18",
  lng: "19",
  hydrogen: "22",
  adblue: "26",
};

function decimal(value?: string) {
  const parsed = Number((value || "").trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function officialTimestamp(value?: string) {
  const match = value?.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  return match
    ? Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4]), Number(match[5]), Number(match[6]))
    : Date.now();
}

export async function GET(request: Request) {
  const database = (env as unknown as { DB: Database }).DB;
  const url = new URL(request.url);
  const province = url.searchParams.get("province")?.trim();
  const fuel = url.searchParams.get("fuel")?.trim() || "diesel_a";
  const required = url.searchParams.getAll("requires").filter((item) => item === "lpg" || item === "adblue");
  const requestedLimit = Number(url.searchParams.get("limit") || 30);
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 30;
  if (!ALLOWED_FUELS.has(fuel)) {
    return Response.json({ error: "Combustible no válido" }, { status: 400 });
  }
  const requiresLpg = required.includes("lpg") ? 1 : 0;
  const requiresAdblue = required.includes("adblue") ? 1 : 0;

  let data: Array<Record<string, unknown>> = [];
  try {
    const rows = await database.prepare(`SELECT
      s.id, s.name, s.brand, s.address, s.municipality, s.province,
      s.lat_e6 AS latE6, s.lng_e6 AS lngE6,
      p.price_micros AS priceMicros, p.currency, p.observed_at AS priceObservedAt,
      lpg.price_micros AS lpgPriceMicros, lpg.observed_at AS lpgObservedAt,
      adblue.price_micros AS adbluePriceMicros, adblue.observed_at AS adblueObservedAt
    FROM stations s
    INNER JOIN station_current_prices p
      ON p.station_id = s.id AND p.fuel_type_id = ?
    LEFT JOIN station_current_prices lpg
      ON lpg.station_id = s.id AND lpg.fuel_type_id = 'lpg'
    LEFT JOIN station_current_prices adblue
      ON adblue.station_id = s.id AND adblue.fuel_type_id = 'adblue'
    WHERE s.status = 'active'
      AND (? IS NULL OR lower(s.province) = lower(?))
      AND (? = 0 OR lpg.station_id IS NOT NULL)
      AND (? = 0 OR adblue.station_id IS NOT NULL)
    ORDER BY p.price_micros ASC, s.name ASC
    LIMIT ?`).bind(fuel, province || null, province || null, requiresLpg, requiresAdblue, limit).all<Record<string, unknown>>();
    data = rows.results || [];
  } catch {
    // Local previews can start before migrations are applied. The official
    // live feed below keeps the read experience useful in that state.
  }

  let delivery = "database";
  if (data.length === 0) {
    try {
      type ProductPayload = { Fecha?: string; ListaEESSPrecio?: Array<Record<string, string>> };
      const productIds = [...new Set([PRODUCT_IDS[fuel], PRODUCT_IDS.lpg, PRODUCT_IDS.adblue])];
      const payloadEntries = await Promise.all(productIds.map(async (productId) => {
        const response = await fetch(`${MITECO_PRODUCT_ENDPOINT}/${productId}`, { headers: { accept: "application/json" } });
        if (!response.ok) throw new Error(`MITECO ${response.status}`);
        return [productId, await response.json() as ProductPayload] as const;
      }));
      const payloads = Object.fromEntries(payloadEntries) as Record<string, ProductPayload>;
      const selectedPayload = payloads[PRODUCT_IDS[fuel]];
      const lpgPayload = payloads[PRODUCT_IDS.lpg];
      const adbluePayload = payloads[PRODUCT_IDS.adblue];
      const observedAt = officialTimestamp(selectedPayload.Fecha);
      const lpgObservedAt = officialTimestamp(lpgPayload.Fecha);
      const adblueObservedAt = officialTimestamp(adbluePayload.Fecha);
      const lpgByStation = new Map((lpgPayload.ListaEESSPrecio || []).map((station) => [station.IDEESS, decimal(station.PrecioProducto)]));
      const adblueByStation = new Map((adbluePayload.ListaEESSPrecio || []).map((station) => [station.IDEESS, decimal(station.PrecioProducto)]));
      data = (selectedPayload.ListaEESSPrecio || [])
        .filter((station) => !province || station.Provincia?.toLocaleLowerCase("es") === province.toLocaleLowerCase("es"))
        .filter((station) => !requiresLpg || lpgByStation.has(station.IDEESS))
        .filter((station) => !requiresAdblue || adblueByStation.has(station.IDEESS))
        .map((station) => {
          const selectedPrice = decimal(station.PrecioProducto) as number;
          const lpgPrice = lpgByStation.get(station.IDEESS) ?? null;
          const adbluePrice = adblueByStation.get(station.IDEESS) ?? null;
          const lat = Number((station.Latitud || "0").replace(",", "."));
          const lng = Number((station["Longitud (WGS84)"] || "0").replace(",", "."));
          return {
            id: `miteco:${station.IDEESS}`,
            name: station.Rótulo || "Estación de servicio",
            brand: station.Rótulo || null,
            address: station.Dirección || null,
            municipality: station.Municipio || null,
            province: station.Provincia || null,
            latE6: Math.round(lat * 1_000_000),
            lngE6: Math.round(lng * 1_000_000),
            priceMicros: Math.round(selectedPrice * 1_000_000),
            currency: "EUR",
            priceObservedAt: observedAt,
            lpgPriceMicros: lpgPrice === null ? null : Math.round(lpgPrice * 1_000_000),
            lpgObservedAt: lpgPrice === null ? null : lpgObservedAt,
            adbluePriceMicros: adbluePrice === null ? null : Math.round(adbluePrice * 1_000_000),
            adblueObservedAt: adbluePrice === null ? null : adblueObservedAt,
          };
        })
        .sort((a, b) => a.priceMicros - b.priceMicros)
        .slice(0, limit);
      delivery = "live-fallback";
    } catch {
      return Response.json({ error: "No se pudo consultar ahora la fuente oficial" }, { status: 502 });
    }
  }

  return Response.json({
    kind: "official",
    source: "MITECO",
    delivery,
    data,
    attribution: "Origen de los datos: Ministerio para la Transición Ecológica y el Reto Demográfico",
  }, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
}
