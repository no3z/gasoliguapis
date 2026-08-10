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
  if (!match) return Date.now();
  const targetUtc = Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4]), Number(match[5]), Number(match[6]));
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(targetUtc)).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const madridAtTarget = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return targetUtc - (madridAtTarget - targetUtc);
}

function haversineKm(latA: number, lngA: number, latB: number, lngB: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const latDistance = radians(latB - latA);
  const lngDistance = radians(lngB - lngA);
  const a = Math.sin(latDistance / 2) ** 2
    + Math.cos(radians(latA)) * Math.cos(radians(latB)) * Math.sin(lngDistance / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
  const database = (env as unknown as { DB: Database }).DB;
  const url = new URL(request.url);
  const province = url.searchParams.get("province")?.trim();
  const fuel = url.searchParams.get("fuel")?.trim() || "diesel_a";
  const query = url.searchParams.get("q")?.trim().slice(0, 80) || "";
  const sortParam = url.searchParams.get("sort");
  const requestedSort = sortParam === "distance" ? "distance" : sortParam === "rating" ? "rating" : "price";
  const latitude = Number(url.searchParams.get("lat"));
  const longitude = Number(url.searchParams.get("lng"));
  const hasLocation = Number.isFinite(latitude) && latitude >= 27 && latitude <= 44.5
    && Number.isFinite(longitude) && longitude >= -19 && longitude <= 5;
  const rawBounds = (url.searchParams.get("bounds") || "").split(",").map(Number);
  const mapBounds = rawBounds.length === 4 && rawBounds.every(Number.isFinite)
    ? {
        west: Math.max(-19, rawBounds[0]),
        south: Math.max(27, rawBounds[1]),
        east: Math.min(5, rawBounds[2]),
        north: Math.min(44.5, rawBounds[3]),
      }
    : null;
  const hasMapBounds = Boolean(mapBounds && mapBounds.west < mapBounds.east && mapBounds.south < mapBounds.north);
  const requestedRadius = Number(url.searchParams.get("radiusKm") || 75);
  const radiusKm = Number.isFinite(requestedRadius) ? Math.min(250, Math.max(5, requestedRadius)) : 75;
  const sort = requestedSort === "distance" && !hasLocation ? "price" : requestedSort;
  const required = url.searchParams.getAll("requires").filter((item) => item === "lpg" || item === "adblue");
  const services = url.searchParams.getAll("service").filter((item) => item === "bathroom" || item === "coffee" || item === "restaurant" || item === "rated");
  const requestedLimit = Number(url.searchParams.get("limit") || 30);
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 30;
  if (!ALLOWED_FUELS.has(fuel)) {
    return Response.json({ error: "Combustible no válido" }, { status: 400 });
  }
  const requiresLpg = required.includes("lpg") ? 1 : 0;
  const requiresAdblue = required.includes("adblue") ? 1 : 0;
  const requiresBathroom = services.includes("bathroom") ? 1 : 0;
  const requiresCoffee = services.includes("coffee") ? 1 : 0;
  const requiresRestaurant = services.includes("restaurant") ? 1 : 0;
  const requiresRating = services.includes("rated") ? 1 : 0;
  const communityFuelCategory = fuel === "lpg" ? "lpg_status" : fuel === "adblue" ? "adblue_status" : "none";
  const queryLike = query ? `%${query.toLocaleLowerCase("es")}%` : null;
  const latDelta = hasLocation ? radiusKm / 111 : 0;
  const lngDelta = hasLocation ? radiusKm / (111 * Math.max(0.2, Math.cos(latitude * Math.PI / 180))) : 0;
  const targetLatE6 = Math.round(latitude * 1_000_000);
  const targetLngE6 = Math.round(longitude * 1_000_000);
  const areaClause = hasMapBounds || hasLocation ? "AND s.lat_e6 BETWEEN ? AND ? AND s.lng_e6 BETWEEN ? AND ?" : "";
  const orderClause = sort === "distance"
    ? "ORDER BY ABS(s.lat_e6 - ?) + ABS(s.lng_e6 - ?) ASC, p.price_micros ASC"
    : sort === "rating"
      ? "ORDER BY (SELECT COALESCE(AVG(sr.value), 0) FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'overall') DESC, (SELECT COUNT(*) FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'overall') DESC, p.price_micros ASC"
      : "ORDER BY p.price_micros ASC, s.name ASC";

  let data: Array<Record<string, unknown>> = [];
  let total = 0;
  let databaseInitialized = false;
  try {
    const values: unknown[] = [
      fuel, province || null, province || null, queryLike, queryLike, requiresLpg, requiresAdblue,
      requiresBathroom, requiresCoffee, requiresRestaurant, requiresRating,
    ];
    if (hasMapBounds && mapBounds) values.push(
      Math.round(mapBounds.south * 1_000_000),
      Math.round(mapBounds.north * 1_000_000),
      Math.round(mapBounds.west * 1_000_000),
      Math.round(mapBounds.east * 1_000_000),
    );
    else if (hasLocation) values.push(
        Math.round((latitude - latDelta) * 1_000_000),
        Math.round((latitude + latDelta) * 1_000_000),
        Math.round((longitude - lngDelta) * 1_000_000),
        Math.round((longitude + lngDelta) * 1_000_000),
      );
    if (sort === "distance") values.push(targetLatE6, targetLngE6);
    values.push(limit);
    const rows = await database.prepare(`SELECT
      s.id, s.name, s.brand, s.address, s.municipality, s.province,
      s.lat_e6 AS latE6, s.lng_e6 AS lngE6,
      p.price_micros AS priceMicros, p.currency, COALESCE(ds.updated_at, p.observed_at) AS priceObservedAt,
      lpg.price_micros AS lpgPriceMicros, COALESCE(ds.updated_at, lpg.observed_at) AS lpgObservedAt,
      adblue.price_micros AS adbluePriceMicros, COALESCE(ds.updated_at, adblue.observed_at) AS adblueObservedAt,
      (SELECT ROUND(AVG(sr.value), 1) FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'overall') AS overallRating,
      (SELECT COUNT(*) FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'overall') AS overallCount,
      (SELECT ROUND(AVG(sr.value), 1) FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'bathroom') AS bathroomRating,
      (SELECT COUNT(*) FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'bathroom') AS bathroomCount,
      (SELECT ROUND(AVG(sr.value), 1) FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'coffee') AS coffeeRating,
      (SELECT COUNT(*) FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'coffee') AS coffeeCount,
      (SELECT ROUND(AVG(sr.value), 1) FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'cleanliness') AS cleanlinessRating,
      (SELECT COUNT(*) FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'cleanliness') AS cleanlinessCount,
      fuel_check.latest_status AS fuelCommunityStatus, fuel_check.latest_at AS fuelCommunityAt,
      fuel_check.latest_proximity_verified AS fuelCommunityNearby,
      bathroom_check.latest_status AS bathroomStatus, bathroom_check.latest_at AS bathroomStatusAt,
      coffee_check.latest_status AS coffeeStatus, coffee_check.latest_at AS coffeeStatusAt,
      restaurant_check.latest_status AS restaurantStatus, restaurant_check.latest_at AS restaurantStatusAt,
      cleanliness_check.latest_status AS cleanlinessStatus, cleanliness_check.latest_at AS cleanlinessStatusAt,
      COUNT(*) OVER() AS totalMatches
    FROM stations s
    INNER JOIN station_current_prices p
      ON p.station_id = s.id AND p.fuel_type_id = ?
    LEFT JOIN station_current_prices lpg
      ON lpg.station_id = s.id AND lpg.fuel_type_id = 'lpg'
    LEFT JOIN station_current_prices adblue
      ON adblue.station_id = s.id AND adblue.fuel_type_id = 'adblue'
    LEFT JOIN data_sources ds ON ds.id = 'miteco-prices'
    LEFT JOIN station_confirmation_summaries fuel_check ON fuel_check.station_id = s.id AND fuel_check.category = '${communityFuelCategory}'
    LEFT JOIN station_confirmation_summaries bathroom_check ON bathroom_check.station_id = s.id AND bathroom_check.category = 'bathroom'
    LEFT JOIN station_confirmation_summaries coffee_check ON coffee_check.station_id = s.id AND coffee_check.category = 'coffee'
    LEFT JOIN station_confirmation_summaries restaurant_check ON restaurant_check.station_id = s.id AND restaurant_check.category = 'restaurant'
    LEFT JOIN station_confirmation_summaries cleanliness_check ON cleanliness_check.station_id = s.id AND cleanliness_check.category = 'cleanliness'
    WHERE s.status = 'active'
      AND s.lat_e6 BETWEEN 27000000 AND 44500000
      AND s.lng_e6 BETWEEN -19000000 AND 5000000
      AND (? IS NULL OR lower(s.province) = lower(?))
      AND (? IS NULL OR lower(coalesce(s.name, '') || ' ' || coalesce(s.brand, '') || ' ' || coalesce(s.address, '') || ' ' || coalesce(s.municipality, '') || ' ' || coalesce(s.province, '')) LIKE ?)
      AND (? = 0 OR lpg.station_id IS NOT NULL)
      AND (? = 0 OR adblue.station_id IS NOT NULL)
      AND (? = 0 OR bathroom_check.latest_status = 'clean' OR EXISTS (SELECT 1 FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'bathroom'))
      AND (? = 0 OR coffee_check.latest_status = 'good' OR EXISTS (SELECT 1 FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'coffee'))
      AND (? = 0 OR restaurant_check.latest_status = 'good')
      AND (? = 0 OR EXISTS (SELECT 1 FROM station_ratings sr WHERE sr.station_id = s.id AND sr.dimension_id = 'overall'))
      ${areaClause}
    ${orderClause}
    LIMIT ?`).bind(...values).all<Record<string, unknown>>();
    const rawRows = rows.results || [];
    total = Number(rawRows[0]?.totalMatches || 0);
    data = rawRows
      .map((station) => hasLocation ? {
        ...station,
        distanceKm: haversineKm(latitude, longitude, Number(station.latE6) / 1_000_000, Number(station.lngE6) / 1_000_000),
      } : station)
      .filter((station) => !hasLocation || hasMapBounds || Number(station.distanceKm) <= radiusKm);
    if (data.length > 0) databaseInitialized = true;
    else {
      const source = await database.prepare("SELECT id FROM data_sources WHERE id = 'miteco-prices' LIMIT 1").all<{ id: string }>();
      databaseInitialized = Boolean(source.results?.length);
    }
  } catch {
    // Local previews can start before migrations are applied. The official
    // live feed below keeps the read experience useful in that state.
  }

  let delivery = "database";
  if (data.length === 0 && !databaseInitialized) {
    try {
      type ProductPayload = { Fecha?: string; ListaEESSPrecio?: Array<Record<string, string>> };
      const productIds = [...new Set([PRODUCT_IDS[fuel], PRODUCT_IDS.lpg, PRODUCT_IDS.adblue])];
      const payloadEntries = await Promise.all(productIds.map(async (productId) => {
        const response = await fetch(`${MITECO_PRODUCT_ENDPOINT}/${productId}`, {
          headers: { accept: "application/json" },
          cf: { cacheEverything: true, cacheTtl: 1800 },
        } as RequestInit & { cf: { cacheEverything: boolean; cacheTtl: number } });
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
      const matches = (selectedPayload.ListaEESSPrecio || [])
        .filter((station) => !province || station.Provincia?.toLocaleLowerCase("es") === province.toLocaleLowerCase("es"))
        .filter((station) => !query || [station.Rótulo, station.Dirección, station.Municipio, station.Provincia]
          .filter(Boolean).join(" ").toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")))
        .filter((station) => !requiresLpg || lpgByStation.has(station.IDEESS))
        .filter((station) => !requiresAdblue || adblueByStation.has(station.IDEESS))
        .filter((station) => {
          if (!hasMapBounds || !mapBounds) return true;
          const lat = Number((station.Latitud || "0").replace(",", "."));
          const lng = Number((station["Longitud (WGS84)"] || "0").replace(",", "."));
          return lng >= mapBounds.west && lng <= mapBounds.east && lat >= mapBounds.south && lat <= mapBounds.north;
        })
        .filter(() => services.length === 0)
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
            overallRating: null,
            overallCount: 0,
            bathroomRating: null,
            bathroomCount: 0,
            coffeeRating: null,
            coffeeCount: 0,
            cleanlinessRating: null,
            cleanlinessCount: 0,
            fuelCommunityStatus: null,
            fuelCommunityAt: null,
            fuelCommunityNearby: 0,
            bathroomStatus: null,
            bathroomStatusAt: null,
            coffeeStatus: null,
            coffeeStatusAt: null,
            restaurantStatus: null,
            restaurantStatusAt: null,
            cleanlinessStatus: null,
            cleanlinessStatusAt: null,
            distanceKm: hasLocation ? haversineKm(latitude, longitude, lat, lng) : null,
          };
        })
        .filter((station) => !hasLocation || hasMapBounds || Number(station.distanceKm) <= radiusKm)
        .sort((a, b) => sort === "distance"
          ? Number(a.distanceKm) - Number(b.distanceKm)
          : sort === "rating"
            ? Number(b.overallRating ?? 0) - Number(a.overallRating ?? 0) || a.priceMicros - b.priceMicros
            : a.priceMicros - b.priceMicros);
      total = matches.length;
      data = matches.slice(0, limit);
      delivery = "live-fallback";
    } catch {
      return Response.json({ error: "No se pudo consultar ahora la fuente oficial" }, { status: 502 });
    }
  }

  return Response.json({
    kind: "official",
    source: "MITECO",
    delivery,
    total,
    scope: hasMapBounds && mapBounds ? { kind: "map", bounds: mapBounds } : hasLocation ? { kind: "nearby", radiusKm, latitude, longitude } : province ? { kind: "province", province } : { kind: "national" },
    sort,
    data,
    attribution: "Origen de los datos: Ministerio para la Transición Ecológica y el Reto Demográfico",
  }, { headers: { "cache-control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400, stale-if-error=86400" } });
}
