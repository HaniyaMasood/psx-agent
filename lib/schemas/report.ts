import { z } from "zod";

export const FactorScoresSchema = z.object({
  fundamentals: z.number(),
  progression: z.number(),
  valuation: z.number(),
  dividends: z.number(),
  liquidity: z.number(),
  sectorOutlook: z.number(),
  news: z.number(),
  shariah: z.number(),
});

export const CompanyScoreSchema = z.object({
  symbol: z.string(),
  overallScore: z.number(),
  factorScores: FactorScoresSchema,
  weightsUsed: FactorScoresSchema,
  rank: z.number(),
  fitsCriteria: z.boolean(),
  fitReasons: z.array(z.string()),
  noFitReasons: z.array(z.string()),
  assumptions: z.array(z.string()),
  risks: z.array(z.string()),
  dataGaps: z.array(z.string()),
  narrative: z.string().optional(),
});

export const ResearchReportSchema = z.object({
  profileSummary: z.string(),
  generatedAt: z.string(),
  disclaimer: z.string(),
  humanReviewRequired: z.literal(true),
  globalAssumptions: z.array(z.string()),
  globalRisks: z.array(z.string()),
  globalDataGaps: z.array(z.string()),
  freshnessSummary: z.string(),
  companies: z.array(CompanyScoreSchema),
});

export type ResearchReport = z.infer<typeof ResearchReportSchema>;
export type CompanyScore = z.infer<typeof CompanyScoreSchema>;

export const DISCLAIMER_TEXT =
  "For research and education only — not investment advice. Data may be delayed or incomplete; verify before any decision.";
