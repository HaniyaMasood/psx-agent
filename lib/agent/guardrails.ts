import { ResearchReportSchema, DISCLAIMER_TEXT } from "@/lib/schemas/report";
import type { ResearchReport } from "@/lib/schemas/report";

const BANNED_PATTERNS = [
  /\bguaranteed?\s+(returns?|profit|gain)/i,
  /\byou should buy\b/i,
  /\byou must buy\b/i,
  /\bstrong buy\b/i,
  /\bdefinitely (buy|sell)\b/i,
  /\bno risk\b/i,
];

export function sanitizeNarrative(text: string): string {
  let out = text;
  for (const p of BANNED_PATTERNS) {
    out = out.replace(p, "[removed — not investment advice]");
  }
  return out;
}

export function enforceReportGuardrails(report: ResearchReport): ResearchReport {
  const sanitized = {
    ...report,
    disclaimer: DISCLAIMER_TEXT,
    humanReviewRequired: true as const,
    companies: report.companies.map((c) => ({
      ...c,
      narrative: c.narrative ? sanitizeNarrative(c.narrative) : c.narrative,
      fitReasons: c.fitReasons.map(sanitizeNarrative),
      noFitReasons: c.noFitReasons.map(sanitizeNarrative),
    })),
  };
  return ResearchReportSchema.parse(sanitized);
}

export function buildFallbackNarrative(symbol: string, fits: boolean, fit: string[], noFit: string[]): string {
  const base = fits
    ? `${symbol} aligns with several of your long-term criteria based on quantitative screening.`
    : `${symbol} has gaps relative to your stated long-term criteria.`;
  const detail = [...fit.slice(0, 2), ...noFit.slice(0, 2)].join(" ");
  return sanitizeNarrative(`${base} ${detail}`.trim());
}
