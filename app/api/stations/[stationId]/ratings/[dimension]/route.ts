import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../../../chatgpt-auth";

type Prepared = {
  bind: (...values: unknown[]) => Prepared;
  run: () => Promise<unknown>;
  first: <T>() => Promise<T | null>;
};
type Database = {
  prepare: (sql: string) => Prepared;
  batch: (statements: Prepared[]) => Promise<unknown>;
};

const DIMENSIONS = new Set(["overall", "coffee", "bathroom", "cleanliness", "accessibility", "value"]);

export async function PUT(
  request: Request,
  context: { params: Promise<{ stationId: string; dimension: string }> },
) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "AUTH_REQUIRED", signInPath: "/signin-with-chatgpt?return_to=%2F" }, { status: 401 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Se esperaba JSON" }, { status: 415 });
  }

  const { stationId, dimension } = await context.params;
  if (!DIMENSIONS.has(dimension)) return Response.json({ error: "Dimensión no válida" }, { status: 400 });
  const body = await request.json().catch(() => null) as { value?: unknown } | null;
  const value = Number(body?.value);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return Response.json({ error: "La puntuación debe estar entre 1 y 5" }, { status: 400 });
  }

  const database = (env as unknown as { DB: Database }).DB;
  const station = await database.prepare("SELECT id FROM stations WHERE id = ? AND status = 'active'").bind(stationId).first<{ id: string }>();
  if (!station) return Response.json({ error: "Estación no encontrada" }, { status: 404 });

  const now = Date.now();
  const localUserId = `chatgpt:${user.userId}`;
  await database.batch([
    database.prepare(`INSERT INTO users
      (id, display_name, role, status, trust_score, created_at, updated_at)
      VALUES (?, ?, 'user', 'active', 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name, updated_at=excluded.updated_at`).bind(
        localUserId, user.displayName, now, now,
      ),
    database.prepare(`INSERT INTO auth_identities
      (id, user_id, provider, provider_subject, email, created_at)
      VALUES (?, ?, 'chatgpt', ?, ?, ?)
      ON CONFLICT(provider, provider_subject) DO UPDATE SET email=excluded.email`).bind(
        `chatgpt:${user.userId}`, localUserId, user.userId, user.email, now,
      ),
    database.prepare(`INSERT OR IGNORE INTO rating_dimensions
      (id, code, display_name, weight_bps) VALUES (?, ?, ?, ?)`).bind(
        dimension, dimension, dimension, dimension === "overall" ? 10000 : 0,
      ),
  ]);

  await database.prepare(`INSERT INTO station_ratings
    (station_id, user_id, dimension_id, value, visit_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?)
    ON CONFLICT(station_id, user_id, dimension_id)
    DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).bind(
      stationId, localUserId, dimension, value, now, now,
    ).run();

  const stats = await database.prepare(`SELECT COUNT(*) AS count, ROUND(AVG(value), 1) AS average
    FROM station_ratings WHERE station_id = ? AND dimension_id = ?`).bind(stationId, dimension).first<{ count: number; average: number }>();
  return Response.json({ value, stats }, { headers: { "cache-control": "no-store" } });
}
