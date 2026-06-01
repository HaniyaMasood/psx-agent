import { Command, END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { ResearchState } from "@/lib/agent/state";
import { parseProfileNode } from "@/lib/agent/nodes/parseProfile";
import { selectUniverseNode } from "@/lib/agent/nodes/selectUniverse";
import { gatherDataNode } from "@/lib/agent/nodes/gatherData";
import { validateFreshnessNode } from "@/lib/agent/nodes/validateFreshness";
import { scoreCompaniesNode } from "@/lib/agent/nodes/scoreCompanies";
import { rankExplainNode } from "@/lib/agent/nodes/rankExplain";
import { compileRisksNode } from "@/lib/agent/nodes/compileRisks";
import { humanReviewGateNode } from "@/lib/agent/nodes/humanReviewGate";

const checkpointer = new MemorySaver();

function buildGraph() {
  return new StateGraph(ResearchState)
    .addNode("parseProfile", parseProfileNode)
    .addNode("selectUniverse", selectUniverseNode)
    .addNode("gatherData", gatherDataNode)
    .addNode("validateFreshness", validateFreshnessNode)
    .addNode("scoreCompanies", scoreCompaniesNode)
    .addNode("rankExplain", rankExplainNode)
    .addNode("compileRisks", compileRisksNode)
    .addNode("humanReviewGate", humanReviewGateNode)
    .addEdge(START, "parseProfile")
    .addEdge("parseProfile", "selectUniverse")
    .addEdge("selectUniverse", "gatherData")
    .addEdge("gatherData", "validateFreshness")
    .addEdge("validateFreshness", "scoreCompanies")
    .addEdge("scoreCompanies", "rankExplain")
    .addEdge("rankExplain", "compileRisks")
    .addEdge("compileRisks", "humanReviewGate")
    .addEdge("humanReviewGate", END);
}

export const researchGraph = buildGraph().compile({ checkpointer });

export async function runResearchWorkflow(
  rawIntake: Record<string, unknown>,
  options: { threadId: string; runId: string }
) {
  return researchGraph.invoke(
    {
      rawIntake,
      runId: options.runId,
      threadId: options.threadId,
    },
    { configurable: { thread_id: options.threadId } }
  );
}

export async function resumeResearchWorkflow(
  threadId: string,
  reviewPayload: { approved: boolean; note?: string }
) {
  return researchGraph.invoke(new Command({ resume: reviewPayload }), {
    configurable: { thread_id: threadId },
  });
}
