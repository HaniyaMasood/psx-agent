import { z } from "zod";

export const FundamentalsSchema = z.object({
  symbol: z.string(),
  sector: z.string().optional(),
  listedIn: z.string().optional(),
  marketCap: z.string().optional(),
  price: z.number().optional(),
  changePercent: z.number().optional(),
  yearChange: z.number().optional(),
  peRatio: z.number().nullable().optional(),
  dividendYield: z.number().nullable().optional(),
  freeFloat: z.string().optional(),
  volume30Avg: z.number().optional(),
  isNonCompliant: z.boolean().optional(),
  timestamp: z.string().optional(),
});

export type Fundamentals = z.infer<typeof FundamentalsSchema>;

export const DividendRecordSchema = z.object({
  symbol: z.string(),
  ex_date: z.string(),
  payment_date: z.string().optional(),
  record_date: z.string().optional(),
  amount: z.number(),
  year: z.number().optional(),
});

export const KlineSchema = z.object({
  symbol: z.string(),
  timeframe: z.string(),
  timestamp: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});

export const CompanyInfoSchema = z.object({
  symbol: z.string(),
  businessDescription: z.string().optional(),
  financialStats: z
    .object({
      marketCap: z.object({ numeric: z.number().optional() }).optional(),
      freeFloatPercent: z.object({ numeric: z.number().optional() }).optional(),
    })
    .optional(),
});

export const SectorStatsSchema = z.record(
  z.string(),
  z.object({
    totalVolume: z.number().optional(),
    totalValue: z.number().optional(),
    gainers: z.number().optional(),
    losers: z.number().optional(),
    avgChangePercent: z.number().optional(),
    symbols: z.array(z.string()).optional(),
  })
);

export const AnnouncementSchema = z.object({
  symbol: z.string().optional(),
  title: z.string(),
  date: z.string().optional(),
  url: z.string().optional(),
});
