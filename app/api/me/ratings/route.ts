import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";

type Prepared = {
  bind: (...values: unknown[]) => Prepared;
  all: <T>() => Promise<{ results?: T[] }>;
};

type Database = { prepare: (sql: string) => Prepared };

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json(
      { signedIn: false, displayName: null, ratings: {} },
      { headers: { "cache-control": "private, no-store" } },
    );
  }

  try {
    const database = (env as unknown as { DB: Database }).DB;
    const rows = await database.prepare(`SELECT station_id AS stationId, value
      FROM station_ratings
      WHERE user_id = ? AND dimension_id = 'overall'
      ORDER BY updated_at DESC
      LIMIT 2000`).bind(`chatgpt:${user.userId}`).all<{ stationId: string; value: number }>();
    const ratings = Object.fromEntries((rows.results || []).map((row) => [row.stationId, Number(row.value)]));
    return Response.json(
      { signedIn: true, displayName: user.displayName, ratings },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { signedIn: true, displayName: user.displayName, ratings: {} },
      { headers: { "cache-control": "private, no-store" } },
    );
  }
}
