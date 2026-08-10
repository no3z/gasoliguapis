import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../../chatgpt-auth";

type Prepared = {
  bind: (...values: unknown[]) => Prepared;
  run: () => Promise<unknown>;
  first: <T>() => Promise<T | null>;
};
type Database = {
  prepare: (sql: string) => Prepared;
  batch: (statements: Prepared[]) => Promise<unknown>;
};

const CATEGORY_STATUSES = {
  lpg_status: new Set(["working", "no_product", "broken"]),
  adblue_status: new Set(["working", "no_product", "broken"]),
  bathroom: new Set(["clean", "dirty", "closed"]),
  coffee: new Set(["good", "poor", "closed"]),
  restaurant: new Set(["good", "poor", "closed"]),
  cleanliness: new Set(["clean", "dirty"]),
} as const;

type Category = keyof typeof CATEGORY_STATUSES;
type StationSeed = {
  name?: unknown;
  brand?: unknown;
  address?: unknown;
  municipality?: unknown;
  province?: unknown;
  latE6?: unknown;
  lngE6?: unknown;
};

function shortText(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) || null : null;
}

function haversineKm(latA: number, lngA: number, latB: number, lngB: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const latDistance = radians(latB - latA);
  const lngDistance = radians(lngB - lngA);
  const a = Math.sin(latDistance / 2) ** 2
    + Math.cos(radians(latA)) * Math.cos(radians(latB)) * Math.sin(lngDistance / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(
  request: Request,
  context: { params: Promise<{ stationId: string }> },
) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "AUTH_REQUIRED", signInPath: "/signin-with-chatgpt?return_to=%2F" }, { status: 401 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Se esperaba JSON" }, { status: 415 });
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > 12_000) {
    return Response.json({ error: "Petición demasiado grande" }, { status: 413 });
  }
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return Response.json({ error: "Origen no permitido" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Origen no permitido" }, { status: 403 });
    }
  }

  const { stationId } = await context.params;
  const body = await request.json().catch(() => null) as {
    category?: unknown;
    status?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    station?: StationSeed;
  } | null;
  const category = typeof body?.category === "string" ? body.category as Category : null;
  const status = typeof body?.status === "string" ? body.status : null;
  if (!category || !(category in CATEGORY_STATUSES) || !status || !CATEGORY_STATUSES[category].has(status as never)) {
    return Response.json({ error: "Confirmación no válida" }, { status: 400 });
  }

  const database = (env as unknown as { DB: Database }).DB;
  let station = await database.prepare("SELECT id, lat_e6 AS latE6, lng_e6 AS lngE6 FROM stations WHERE id = ? AND status = 'active'")
    .bind(stationId).first<{ id: string; latE6: number; lngE6: number }>();

  if (!station) {
    const seed = body?.station;
    const latE6 = Number(seed?.latE6);
    const lngE6 = Number(seed?.lngE6);
    const name = shortText(seed?.name, 140);
    if (!/^miteco:\d+$/.test(stationId) || !name || !Number.isInteger(latE6) || !Number.isInteger(lngE6)
      || latE6 < 27_000_000 || latE6 > 44_500_000 || lngE6 < -19_000_000 || lngE6 > 5_000_000) {
      return Response.json({ error: "Estación no encontrada" }, { status: 404 });
    }
    const now = Date.now();
    await database.prepare(`INSERT OR IGNORE INTO stations
      (id, official_id, name, brand, address, municipality, province, lat_e6, lng_e6, geo_cell, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`).bind(
        stationId,
        stationId.slice("miteco:".length),
        name,
        shortText(seed?.brand, 100),
        shortText(seed?.address, 200),
        shortText(seed?.municipality, 100),
        shortText(seed?.province, 80),
        latE6,
        lngE6,
        `${(latE6 / 1_000_000).toFixed(1)}:${(lngE6 / 1_000_000).toFixed(1)}`,
        now,
        now,
      ).run();
    station = { id: stationId, latE6, lngE6 };
  }

  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  const validLocation = Number.isFinite(latitude) && latitude >= 27 && latitude <= 44.5
    && Number.isFinite(longitude) && longitude >= -19 && longitude <= 5;
  const proximityVerified = validLocation
    ? haversineKm(latitude, longitude, station.latE6 / 1_000_000, station.lngE6 / 1_000_000) <= 2
    : false;

  const now = Date.now();
  const dayBucket = Math.floor(now / 86_400_000);
  const localUserId = `chatgpt:${user.userId}`;
  await database.batch([
    database.prepare(`INSERT INTO users
      (id, display_name, role, status, trust_score, created_at, updated_at)
      VALUES (?, ?, 'user', 'active', 300, ?, ?)
      ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name, updated_at=excluded.updated_at`).bind(
        localUserId, user.displayName, now, now,
      ),
    database.prepare(`INSERT INTO auth_identities
      (id, user_id, provider, provider_subject, email, created_at)
      VALUES (?, ?, 'chatgpt', ?, ?, ?)
      ON CONFLICT(provider, provider_subject) DO UPDATE SET email=excluded.email`).bind(
        `chatgpt:${user.userId}`, localUserId, user.userId, user.email, now,
      ),
  ]);

  const confirmationId = crypto.randomUUID();
  await database.prepare(`INSERT INTO station_confirmations
    (id, station_id, user_id, category, status, proximity_verified, day_bucket, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(station_id, user_id, category, day_bucket)
    DO UPDATE SET status=excluded.status, proximity_verified=excluded.proximity_verified, created_at=excluded.created_at`).bind(
      confirmationId, stationId, localUserId, category, status, proximityVerified ? 1 : 0, dayBucket, now,
    ).run();
  await database.prepare(`INSERT INTO station_confirmation_summaries
    (station_id, category, latest_status, latest_at, latest_proximity_verified)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(station_id, category) DO UPDATE SET
      latest_status=excluded.latest_status,
      latest_at=excluded.latest_at,
      latest_proximity_verified=excluded.latest_proximity_verified
    WHERE excluded.latest_at >= station_confirmation_summaries.latest_at`).bind(
      stationId, category, status, now, proximityVerified ? 1 : 0,
    ).run();

  return Response.json({
    confirmation: { category, status, createdAt: now, proximityVerified },
  }, { headers: { "cache-control": "no-store" } });
}
