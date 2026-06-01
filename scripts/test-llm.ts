/**
 * Diagnose LLM connectivity (same config as rankExplain).
 * Run: npx tsx scripts/test-llm.ts
 */
import "dotenv/config";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createLlm, isLlmConfigured } from "../lib/agent/llm";

async function main() {
  console.log("isLlmConfigured:", isLlmConfigured());
  console.log("LLM_MODEL:", process.env.LLM_MODEL ?? "(default grok-2-latest)");
  console.log("LLM_BASE_URL:", process.env.LLM_BASE_URL ?? "(default https://api.x.ai/v1)");
  console.log("LLM_API_KEY length:", process.env.LLM_API_KEY?.length ?? 0);

  if (!isLlmConfigured()) {
    console.error("FAIL: LLM_API_KEY is missing");
    process.exit(1);
  }

  try {
    const llm = createLlm();
    const res = await llm.invoke([
      new SystemMessage("Reply with exactly: LLM_OK"),
      new HumanMessage("ping"),
    ]);
    const text =
      typeof res.content === "string" ? res.content : String(res.content);
    console.log("invoke OK, content preview:", text.slice(0, 200));
  } catch (err) {
    console.error("invoke FAILED:");
    console.error(err);
    process.exit(1);
  }
}

main();
