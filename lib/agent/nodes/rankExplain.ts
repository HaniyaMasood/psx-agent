import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createLlm, isLlmConfigured } from "@/lib/agent/llm";
import { buildFallbackNarrative, sanitizeNarrative } from "@/lib/agent/guardrails";
import type { ResearchStateType } from "@/lib/agent/state";
import type { CompanyScore } from "@/lib/schemas/report";

export async function rankExplainNode(
  state: ResearchStateType
): Promise<Partial<ResearchStateType>> {
  const profile = state.profile!;
  const enriched: CompanyScore[] = [];

  for (const company of state.scoredCompanies) {
    let narrative: string;
    if (isLlmConfigured()) {
      try {
        const llm = createLlm();
        const res = await llm.invoke([
          new SystemMessage(
            `You explain PSX long-term research fit in neutral language. Never say buy, sell, hold, or guarantee returns. Mention assumptions and risks briefly.`
          ),
          new HumanMessage(
            JSON.stringify({
              profile,
              company,
            })
          ),
        ]);
        narrative = sanitizeNarrative(
          typeof res.content === "string" ? res.content : String(res.content)
        );
      } catch (err) {
        console.warn(
          `[rankExplain] LLM failed for ${company.symbol}, using fallback:`,
          err instanceof Error ? err.message : err
        );
        narrative = buildFallbackNarrative(
          company.symbol,
          company.fitsCriteria,
          company.fitReasons,
          company.noFitReasons
        );
      }
    } else {
      narrative = buildFallbackNarrative(
        company.symbol,
        company.fitsCriteria,
        company.fitReasons,
        company.noFitReasons
      );
    }
    enriched.push({ ...company, narrative });
  }

  return { scoredCompanies: enriched, status: "explained" };
}
