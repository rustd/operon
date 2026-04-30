import { buildFallbackIntent } from "@/lib/demoData";
import { callOpenAIJson } from "@/lib/openai";
import type { AgentResult, IntentOutput, RunMode } from "@/lib/types";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    role: { type: "string" },
    businessGoal: { type: "string" },
    northStarMetric: { type: "string" },
    constraints: { type: "array", items: { type: "string" } },
    personaAssumptions: { type: "array", items: { type: "string" } }
  },
  required: ["role", "businessGoal", "northStarMetric", "constraints", "personaAssumptions"]
} as const;

function normalizeIntent(data: IntentOutput, mode: RunMode): IntentOutput {
  return {
    role: data.role || "Business Operator",
    businessGoal: data.businessGoal || buildFallbackIntent("", mode).businessGoal,
    northStarMetric: data.northStarMetric || "Risk-adjusted revenue",
    constraints: data.constraints?.slice(0, 4) ?? [],
    personaAssumptions: data.personaAssumptions?.slice(0, 4) ?? []
  };
}

export async function runIntentAgent(prompt: string, mode: RunMode): Promise<AgentResult<IntentOutput>> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const fallback = buildFallbackIntent(prompt, mode);
  const system =
    "You are the Intent Agent for Operon. Translate a business prompt into a concise business profile. Return valid JSON only.";
  const user = JSON.stringify({
    task: "Extract role, businessGoal, northStarMetric, constraints, and personaAssumptions.",
    mode,
    prompt
  });

  try {
    const result = await callOpenAIJson<IntentOutput>({
      system,
      user,
      model,
      schema: { name: "intent_agent_output", schema }
    });
    const data = normalizeIntent(result.data, mode);
    return {
      model,
      data,
      trace: {
        agent: "Intent Agent",
        input: prompt,
        outputSummary: `Intent Agent understood ${data.role} optimizing for ${data.northStarMetric.toLowerCase()}.`,
        confidence: 0.87
      }
    };
  } catch {
    return {
      model,
      data: fallback,
      trace: {
        agent: "Intent Agent",
        input: prompt,
        outputSummary: `Intent Agent used the fallback profile for ${fallback.role} and kept the goal focused on ${fallback.northStarMetric.toLowerCase()}.`,
        confidence: 0.68
      }
    };
  }
}
