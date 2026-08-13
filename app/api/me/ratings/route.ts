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
    const rows = await database.prepare(`SELECT station_id AS stationId, dimension_id AS dimension, value
      FROM station_ratings
      WHERE user_id = ? AND dimension_id IN ('overall', 'bathroom', 'coffee', 'cleanliness')
      ORDER BY updated_at DESC
      LIMIT 8000`).bind(`chatgpt:${user.userId}`).all<{ stationId: string; dimension: string; value: number }>();
    const ratings = (rows.results || []).reduce<Record<string, Record<string, number>>>((result, row) => {
      result[row.stationId] ||= {};
      result[row.stationId][row.dimension] = Number(row.value);
      return result;
    }, {});
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
