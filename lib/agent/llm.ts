import { ChatOpenAI } from "@langchain/openai";

export function createLlm(): ChatOpenAI {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_API_KEY is required. Set it in .env (Grok, LibreChat, or OpenAI-compatible gateway).");
  }

  return new ChatOpenAI({
    apiKey,
    model: process.env.LLM_MODEL ?? "grok-2-latest",
    temperature: 0.2,
    configuration: {
      baseURL: process.env.LLM_BASE_URL ?? "https://api.x.ai/v1",
    },
  });
}

export function isLlmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY);
}
