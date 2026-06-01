export type CacheDataType =
  | "fundamentals"
  | "dividends"
  | "prices"
  | "announcements"
  | "company";

export const TTL_MS: Record<CacheDataType, number> = {
  fundamentals: 24 * 60 * 60 * 1000,
  dividends: 7 * 24 * 60 * 60 * 1000,
  prices: 60 * 60 * 1000,
  announcements: 6 * 60 * 60 * 1000,
  company: 7 * 24 * 60 * 60 * 1000,
};

export function isFresh(fetchedAt: Date, type: CacheDataType): boolean {
  return Date.now() - fetchedAt.getTime() < TTL_MS[type];
}

export function freshnessLabel(fetchedAt: Date, type: CacheDataType): string {
  const ageMs = Date.now() - fetchedAt.getTime();
  const ttl = TTL_MS[type];
  const hours = Math.round(ageMs / (60 * 60 * 1000));
  if (ageMs <= ttl) return `fresh (${hours}h old)`;
  return `stale (${hours}h old, TTL ${Math.round(ttl / (60 * 60 * 1000))}h)`;
}
