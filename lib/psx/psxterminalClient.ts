import {
  CompanyInfoSchema,
  DividendRecordSchema,
  FundamentalsSchema,
  KlineSchema,
  SectorStatsSchema,
  type Fundamentals,
} from "./schemas";

const BASE = "https://psxterminal.com/api";
const TIMEOUT = Number(process.env.PSX_REQUEST_TIMEOUT_MS ?? 20000);

async function fetchJson<T>(path: string, retries = 2): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const res = await fetch(`${BASE}${path}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
      });
      if (!res.ok) {
        throw new Error(`PSX Terminal ${path}: ${res.status} ${res.statusText}`);
      }
      const body = (await res.json()) as { success?: boolean; data?: T };
      if (body.success === false) {
        throw new Error(`PSX Terminal ${path}: unsuccessful response`);
      }
      return (body.data ?? body) as T;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error(`PSX Terminal ${path}: failed`);
}

export async function getSymbols(): Promise<string[]> {
  const data = await fetchJson<string[]>("/symbols");
  return data.filter((s) => /^[A-Z]{2,12}$/.test(s));
}

export async function getFundamentals(symbol: string): Promise<Fundamentals> {
  const data = await fetchJson<unknown>(`/fundamentals/${symbol.toUpperCase()}`);
  return FundamentalsSchema.parse(data);
}

export async function getDividends(symbol: string) {
  const data = await fetchJson<unknown[]>(`/dividends/${symbol.toUpperCase()}`);
  return data.map((d) => DividendRecordSchema.parse(d));
}

export async function getKlines(symbol: string, limit = 120) {
  const sym = symbol.toUpperCase();
  const limits = [limit, 60, 30];
  for (const lim of limits) {
    try {
      const data = await fetchJson<unknown[]>(`/klines/${sym}/1d?limit=${lim}`);
      return data.map((k) => KlineSchema.parse(k));
    } catch {
      continue;
    }
  }
  return [];
}

export async function getCompany(symbol: string) {
  const data = await fetchJson<unknown>(`/companies/${symbol.toUpperCase()}`);
  return CompanyInfoSchema.parse(data);
}

export async function getSectorStats() {
  const data = await fetchJson<unknown>("/stats/sectors");
  return SectorStatsSchema.parse(data);
}

export async function getMarketStats() {
  return fetchJson<Record<string, unknown>>("/stats/REG");
}

/** Liquid large-cap universe used when broad screening is too slow */
export const LIQUID_UNIVERSE = [
  "FFC", "OGDC", "PPL", "HUBC", "ENGRO", "LUCK", "MARI", "SYS", "MTL",
  "UBL", "MCB", "HBL", "BAHL", "EFERT", "FATIMA", "POL", "PSO", "ATRL",
  "NESTLE", "COLG", "DGKC", "MLCF", "SEARL", "MEBL", "FFBL", "HUBC",
  "ABOT", "GLAXO", "PAEL", "TRG",
];
