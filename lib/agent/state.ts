import { Annotation } from "@langchain/langgraph";
import type { InvestmentProfile } from "@/lib/schemas/profile";
import type { ResearchReport } from "@/lib/schemas/report";
import type { CompanyScore } from "@/lib/schemas/report";
import type { CompanyBundle } from "@/lib/psx/dataService";

export const ResearchState = Annotation.Root({
  rawIntake: Annotation<Record<string, unknown>>({
    reducer: (_, update) => update,
    default: () => ({}),
  }),
  profile: Annotation<InvestmentProfile | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  candidates: Annotation<string[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  bundles: Annotation<CompanyBundle[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  freshnessIssues: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  dataGaps: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  scoredCompanies: Annotation<CompanyScore[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  report: Annotation<ResearchReport | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  reviewApproved: Annotation<boolean | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  status: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "pending",
  }),
  runId: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  threadId: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
});

export type ResearchStateType = typeof ResearchState.State;
