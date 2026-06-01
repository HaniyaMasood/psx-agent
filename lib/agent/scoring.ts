import type { InvestmentProfile, RiskTolerance } from "@/lib/schemas/profile";
import type { CompanyScore } from "@/lib/schemas/report";
import type { CompanyBundle } from "@/lib/psx/dataService";
import { isShariahCompliant } from "@/lib/psx/shariah";

export type FactorKey =
  | "fundamentals"
  | "progression"
  | "valuation"
  | "dividends"
  | "liquidity"
  | "sectorOutlook"
  | "news"
  | "shariah";

export type FactorScores = Record<FactorKey, number>;

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function weightsForProfile(risk: RiskTolerance): FactorScores {
  const base: FactorScores = {
    fundamentals: 15,
    progression: 15,
    valuation: 12,
    dividends: 12,
    liquidity: 10,
    sectorOutlook: 10,
    news: 8,
    shariah: 18,
  };
  if (risk === "conservative") {
    return { ...base, dividends: 20, liquidity: 15, valuation: 15, progression: 8 };
  }
  if (risk === "growth" || risk === "aggressive") {
    return { ...base, progression: 22, fundamentals: 18, dividends: 6, valuation: 8 };
  }
  return base;
}

function scoreFundamentals(f: CompanyBundle["fundamentals"]): number {
  const pe = f.peRatio;
  if (pe == null || pe <= 0) return 40;
  if (pe >= 5 && pe <= 18) return 85;
  if (pe <= 25) return 65;
  return 45;
}

function scoreProgression(bundle: CompanyBundle): number {
  const closes =
    bundle.klines.length > 0
      ? bundle.klines.map((k) => k.close)
      : (bundle.eodFallback?.map((r) => r[1]) ?? []);
  if (closes.length < 30) return 35;
  const recent = closes.slice(-252);
  const start = recent[0];
  const end = recent[recent.length - 1];
  if (!start || !end) return 40;
  const cagr = (end / start - 1) * 100;
  if (cagr > 25) return 90;
  if (cagr > 10) return 75;
  if (cagr > 0) return 60;
  if (cagr > -10) return 45;
  return 25;
}

function scoreValuation(f: CompanyBundle["fundamentals"], sectorMedianPe: number): number {
  const pe = f.peRatio;
  if (pe == null || pe <= 0) return 50;
  if (sectorMedianPe <= 0) {
    return pe <= 15 ? 80 : pe <= 22 ? 60 : 40;
  }
  const ratio = pe / sectorMedianPe;
  if (ratio <= 0.85) return 85;
  if (ratio <= 1.1) return 70;
  if (ratio <= 1.4) return 50;
  return 30;
}

function scoreDividends(dividends: CompanyBundle["dividends"], yieldPct: number | null | undefined): number {
  if (!dividends.length) return yieldPct && yieldPct > 3 ? 55 : 30;
  const years = new Set(dividends.map((d) => d.year ?? new Date(d.ex_date).getFullYear()));
  const consistency = years.size >= 3 ? 30 : 10;
  const total = dividends.slice(0, 8).reduce((s, d) => s + d.amount, 0);
  const amountScore = total > 20 ? 40 : total > 10 ? 28 : 15;
  const yieldScore = yieldPct && yieldPct >= 5 ? 30 : yieldPct && yieldPct >= 3 ? 20 : 10;
  return clamp(consistency + amountScore + yieldScore);
}

function scoreLiquidity(f: CompanyBundle["fundamentals"]): number {
  const vol = f.volume30Avg ?? 0;
  if (vol > 2_000_000) return 90;
  if (vol > 500_000) return 75;
  if (vol > 100_000) return 55;
  return 35;
}

function scoreSector(sectorKey: string | undefined, sectorStats: Record<string, { avgChangePercent?: number; gainers?: number; losers?: number }> | null): number {
  if (!sectorKey || !sectorStats) return 50;
  const entry = Object.entries(sectorStats).find(([k]) => k.includes(sectorKey) || sectorKey.includes(k));
  if (!entry) return 50;
  const [, s] = entry;
  const gainers = s.gainers ?? 0;
  const losers = s.losers ?? 0;
  const ratio = gainers / Math.max(1, gainers + losers);
  const momentum = (s.avgChangePercent ?? 0) * 100;
  return clamp(50 + ratio * 30 + Math.sign(momentum) * 10);
}

function scoreNews(announcements: CompanyBundle["announcements"]): number {
  if (!announcements.length) return 50;
  const negative = /loss|default|penalty|fraud|downgrade|suspension/i;
  const positive = /profit|dividend|expansion|upgrade|record|bonus/i;
  let score = 50;
  for (const a of announcements) {
    if (negative.test(a.title)) score -= 8;
    if (positive.test(a.title)) score += 8;
  }
  return clamp(score);
}

function scoreShariah(f: CompanyBundle["fundamentals"], shariahOnly: boolean): number {
  const ok = isShariahCompliant(f);
  if (shariahOnly && !ok) return 0;
  return ok ? 100 : 40;
}

export function scoreCompany(
  bundle: CompanyBundle,
  profile: InvestmentProfile,
  sectorStats: Record<string, { avgChangePercent?: number; gainers?: number; losers?: number }> | null,
  sectorMedianPe: number
): Omit<CompanyScore, "rank" | "narrative"> {
  const weights = weightsForProfile(profile.riskTolerance);
  const factorScores: FactorScores = {
    fundamentals: scoreFundamentals(bundle.fundamentals),
    progression: scoreProgression(bundle),
    valuation: scoreValuation(bundle.fundamentals, sectorMedianPe),
    dividends: scoreDividends(bundle.dividends, bundle.fundamentals.dividendYield),
    liquidity: scoreLiquidity(bundle.fundamentals),
    sectorOutlook: scoreSector(bundle.fundamentals.sector, sectorStats),
    news: scoreNews(bundle.announcements),
    shariah: scoreShariah(bundle.fundamentals, profile.shariahOnly),
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let overall = 0;
  for (const k of Object.keys(factorScores) as FactorKey[]) {
    overall += (factorScores[k] * weights[k]) / totalWeight;
  }

  const fitsCriteria =
    overall >= 55 &&
    (!profile.shariahOnly || factorScores.shariah >= 100);

  const fitReasons: string[] = [];
  const noFitReasons: string[] = [];
  if (factorScores.fundamentals >= 65) fitReasons.push("Solid fundamental profile (P/E in reasonable range).");
  else noFitReasons.push("Weaker fundamentals vs long-term quality bar.");
  if (factorScores.progression >= 60) fitReasons.push("Multi-year price progression supportive.");
  else noFitReasons.push("Limited or weak multi-year progression.");
  if (factorScores.dividends >= 60) fitReasons.push("Dividend profile supports income-oriented long-term holding.");
  if (profile.shariahOnly && factorScores.shariah < 100) {
    noFitReasons.push("Does not meet Shariah-only requirement.");
  }

  return {
    symbol: bundle.symbol,
    overallScore: Math.round(overall * 10) / 10,
    factorScores,
    weightsUsed: weights,
    fitsCriteria,
    fitReasons,
    noFitReasons,
    assumptions: [
      "Scores use publicly available PSX/third-party data feeds; corporate actions may not be fully reflected.",
      `Investment horizon assumed: ${profile.horizonYears} years.`,
    ],
    risks: [
      "Pakistan macro, currency, and political risk can affect all PSX holdings.",
      "Model scores are not forecasts of future returns.",
    ],
    dataGaps: [...bundle.dataGaps],
  };
}

export function rankScores(scores: CompanyScore[]): CompanyScore[] {
  return [...scores]
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

export function computeSectorMedianPe(bundles: CompanyBundle[]): number {
  const pes = bundles
    .map((b) => b.fundamentals.peRatio)
    .filter((p): p is number => p != null && p > 0);
  return median(pes);
}
