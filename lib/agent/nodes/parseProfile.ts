import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createLlm } from "@/lib/agent/llm";
import {
  InvestmentProfileSchema,
  RawIntakeSchema,
  type InvestmentProfile,
} from "@/lib/schemas/profile";
import type { ResearchStateType } from "@/lib/agent/state";

export async function parseProfileNode(
  state: ResearchStateType
): Promise<Partial<ResearchStateType>> {
  const parsed = RawIntakeSchema.safeParse(state.rawIntake);
  if (parsed.success) {
    const sectors = (parsed.data.sectorPreferences ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const profile = InvestmentProfileSchema.parse({
      goal: parsed.data.goal,
      horizonYears: parsed.data.horizonYears,
      riskTolerance: parsed.data.riskTolerance.toLowerCase(),
      shariahOnly: parsed.data.shariahOnly,
      sectorPreferences: sectors,
      capitalPkr: parsed.data.capitalPkr,
      notes: parsed.data.notes,
    });
    return { profile, status: "profile_parsed" };
  }

  try {
    const llm = createLlm();
    const res = await llm.invoke([
      new SystemMessage(
        `Extract a long-term PSX investment profile as JSON only. Fields: goal (string), horizonYears (number), riskTolerance (conservative|moderate|growth|aggressive), shariahOnly (boolean), sectorPreferences (string array), capitalPkr (optional number), notes (optional). No buy/sell advice.`
      ),
      new HumanMessage(JSON.stringify(state.rawIntake)),
    ]);
    const text =
      typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const profile = InvestmentProfileSchema.parse(
      JSON.parse(jsonMatch?.[0] ?? text) as InvestmentProfile
    );
    return { profile, status: "profile_parsed" };
  } catch {
    const profile = InvestmentProfileSchema.parse({
      goal: String(state.rawIntake.goal ?? "Long-term wealth building"),
      horizonYears: Number(state.rawIntake.horizonYears ?? 10),
      riskTolerance: "moderate",
      shariahOnly: Boolean(state.rawIntake.shariahOnly),
      sectorPreferences: [],
    });
    return { profile, status: "profile_parsed_fallback" };
  }
}
