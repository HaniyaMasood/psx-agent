import { getDb, isDbAvailable } from "@/lib/db/knex";
import type { CacheDataType } from "./freshness";
import { isFresh } from "./freshness";

type CacheTable =
  | "fundamentals_cache"
  | "dividends_cache"
  | "price_cache"
  | "announcements_cache";

const TABLE_BY_TYPE: Record<Exclude<CacheDataType, "company">, CacheTable> = {
  fundamentals: "fundamentals_cache",
  dividends: "dividends_cache",
  prices: "price_cache",
  announcements: "announcements_cache",
};

export async function getCached<T>(
  symbol: string,
  type: Exclude<CacheDataType, "company">
): Promise<{ payload: T; fetchedAt: Date } | null> {
  if (!(await isDbAvailable())) return null;
  const table = TABLE_BY_TYPE[type];
  const db = await getDb();
  const row = await db(table).where({ symbol: symbol.toUpperCase() }).first();
  if (!row) return null;
  return {
    payload: row.payload as T,
    fetchedAt: new Date(row.fetched_at),
  };
}

export async function setCached(
  symbol: string,
  type: Exclude<CacheDataType, "company">,
  payload: unknown
): Promise<void> {
  if (!(await isDbAvailable())) return;
  const table = TABLE_BY_TYPE[type];
  const db = await getDb();
  await db(table)
    .insert({
      symbol: symbol.toUpperCase(),
      payload,
      fetched_at: new Date(),
    })
    .onConflict("symbol")
    .merge({ payload, fetched_at: new Date() });
}

export async function getCachedIfFresh<T>(
  symbol: string,
  type: Exclude<CacheDataType, "company">
): Promise<T | null> {
  const cached = await getCached<T>(symbol, type);
  if (!cached) return null;
  if (!isFresh(cached.fetchedAt, type)) return null;
  return cached.payload;
}
