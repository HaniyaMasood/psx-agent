import { getCachedIfFresh, setCached } from "./cache";
import {
  getAnnouncementsForSymbol,
  getEodTimeseries,
  type ParsedAnnouncement,
} from "./dpsClient";
import {
  getCompany,
  getDividends,
  getFundamentals,
  getKlines,
  getSectorStats,
  getSymbols,
  LIQUID_UNIVERSE,
} from "./psxterminalClient";
import { freshnessLabel, type CacheDataType } from "./freshness";
import type { Fundamentals } from "./schemas";

export interface CompanyBundle {
  symbol: string;
  fundamentals: Fundamentals;
  dividends: Awaited<ReturnType<typeof getDividends>>;
  klines: Awaited<ReturnType<typeof getKlines>>;
  company: Awaited<ReturnType<typeof getCompany>>;
  announcements: Awaited<ReturnType<typeof getAnnouncementsForSymbol>>;
  eodFallback?: number[][];
  freshness: Record<string, string>;
  dataGaps: string[];
}

async function withCache<T>(
  symbol: string,
  type: CacheDataType,
  fetcher: () => Promise<T>
): Promise<{ data: T; freshness: string }> {
  if (type !== "company") {
    const cached = await getCachedIfFresh<T>(symbol, type);
    if (cached) {
      return { data: cached, freshness: `cached ${type}: fresh` };
    }
  }
  const data = await fetcher();
  if (type !== "company") {
    await setCached(symbol, type, data);
  }
  return { data, freshness: `live ${type}: just fetched` };
}

export async function fetchCompanyBundle(symbol: string): Promise<CompanyBundle> {
  const dataGaps: string[] = [];
  const freshness: Record<string, string> = {};

  let fundamentals: Fundamentals;
  try {
    const fund = await withCache(symbol, "fundamentals", () => getFundamentals(symbol));
    fundamentals = fund.data;
    freshness.fundamentals = fund.freshness;
  } catch {
    dataGaps.push("Fundamentals unavailable from primary source.");
    fundamentals = { symbol: symbol.toUpperCase() };
  }

  let dividends: Awaited<ReturnType<typeof getDividends>> = [];
  try {
    const div = await withCache(symbol, "dividends", () => getDividends(symbol));
    dividends = div.data;
    freshness.dividends = div.freshness;
  } catch {
    dataGaps.push("Dividend history unavailable.");
  }

  let klines = await withCache(symbol, "prices", () => getKlines(symbol, 120));
  freshness.prices = klines.freshness;
  let eodFallback: number[][] | undefined;
  if (klines.data.length < 30) {
    try {
      eodFallback = await getEodTimeseries(symbol);
      if (eodFallback.length > 0) {
        dataGaps.push("Used DPS EOD fallback because klines history was short.");
      }
    } catch {
      dataGaps.push("Insufficient price history from primary and fallback sources.");
    }
  }

  let company;
  try {
    company = await getCompany(symbol);
    freshness.company = freshnessLabel(new Date(), "company");
  } catch {
    dataGaps.push("Company profile unavailable.");
    company = { symbol };
  }

  let announcements: ParsedAnnouncement[] = [];
  try {
    const ann = await withCache(symbol, "announcements", () =>
      getAnnouncementsForSymbol(symbol)
    );
    announcements = ann.data;
    freshness.announcements = ann.freshness;
  } catch {
    announcements = [];
    dataGaps.push("Announcements could not be retrieved.");
  }

  return {
    symbol: symbol.toUpperCase(),
    fundamentals,
    dividends,
    klines: klines.data,
    company,
    announcements,
    eodFallback,
    freshness,
    dataGaps,
  };
}

export async function resolveUniverse(options: {
  shariahOnly: boolean;
  sectorPreferences: string[];
  maxCandidates: number;
}): Promise<string[]> {
  const max = options.maxCandidates;
  let candidates = [...LIQUID_UNIVERSE];

  try {
    const all = await getSymbols();
    const equity = all.filter((s) => /^[A-Z]{3,6}$/.test(s));
    candidates = [...new Set([...candidates, ...equity.slice(0, 200)])];
  } catch {
    // keep liquid universe
  }

  if (options.sectorPreferences.length > 0) {
    try {
      const sectors = await getSectorStats();
      const sectorKeys = Object.keys(sectors).filter((k) =>
        options.sectorPreferences.some((p) =>
          k.toUpperCase().includes(p.toUpperCase())
        )
      );
      const fromSectors = sectorKeys.flatMap((k) => sectors[k]?.symbols ?? []);
      candidates = [...new Set([...fromSectors, ...candidates])];
    } catch {
      // ignore
    }
  }

  const selected: string[] = [];
  for (const sym of candidates) {
    if (selected.length >= max * 2) break;
    try {
      const f = await getFundamentals(sym);
      if (options.shariahOnly && f.isNonCompliant) continue;
      if (options.shariahOnly && !(f.listedIn ?? "").includes("KMI")) {
        if (f.isNonCompliant !== false) continue;
      }
      selected.push(sym);
    } catch {
      continue;
    }
  }

  return [...new Set(selected)].slice(0, max);
}

export { getSectorStats, getSymbols, LIQUID_UNIVERSE };
