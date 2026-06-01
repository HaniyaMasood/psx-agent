import { z } from "zod";

export const RiskToleranceSchema = z.enum(["conservative", "moderate", "growth", "aggressive"]);
export type RiskTolerance = z.infer<typeof RiskToleranceSchema>;

export const InvestmentProfileSchema = z.object({
  goal: z.string().min(3),
  horizonYears: z.number().int().min(1).max(40),
  riskTolerance: RiskToleranceSchema,
  shariahOnly: z.boolean(),
  sectorPreferences: z.array(z.string()).default([]),
  capitalPkr: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type InvestmentProfile = z.infer<typeof InvestmentProfileSchema>;

export const RawIntakeSchema = z.object({
  goal: z.string(),
  horizonYears: z.coerce.number(),
  riskTolerance: z.string(),
  shariahOnly: z.coerce.boolean().optional().default(false),
  sectorPreferences: z.string().optional(),
  capitalPkr: z.coerce.number().optional(),
  notes: z.string().optional(),
});
