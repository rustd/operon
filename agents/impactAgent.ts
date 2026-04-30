import { calculateImpact } from "@/lib/demoData";
import { callOpenAIJson } from "@/lib/openai";
import type { AgentResult, BusinessEntity, Decision, ImpactOutput, RunMode } from "@/lib/types";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pipelineValue: { type: "number" },
    atRiskRevenue: { type: "number" },
    upsideToday: { type: "number" },
    confidence: { type: "number" }
  },
  required: ["pipelineValue", "atRiskRevenue", "upsideToday", "confidence"]
} as const;

function normalizeImpact(data: ImpactOutput, fallback: ImpactOutput): ImpactOutput {
  return {
    pipelineValue: Math.max(0, Math.round(data.pipelineValue || fallback.pipelineValue)),
    atRiskRevenue: Math.max(0, Math.round(data.atRiskRevenue || fallback.atRiskRevenue)),
    upsideToday: Math.max(0, Math.round(data.upsideToday || fallback.upsideToday)),
    confidence: Number(Math.min(0.99, Math.max(0.45, data.confidence || fallback.confidence)).toFixed(2)),
    before: fallback.before,
    after: fallback.after
  };
}

export async function runImpactAgent({
  entities,
  decisions,
  mode
}: {
  entities: BusinessEntity[];
  decisions: Decision[];
  mode: RunMode;
}): Promise<AgentResult<ImpactOutput>> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const fallback = calculateImpact(entities, decisions, mode);
  const system =
    "You are the Impact Agent for Operon. Calculate business impact from entities and decisions. Return valid JSON only.";
  const user = JSON.stringify({
    task: "Calculate pipelineValue, atRiskRevenue, upsideToday, and confidence from the entities and decisions.",
    mode,
    entities,
    decisions
  });

  try {
    const result = await callOpenAIJson<ImpactOutput>({
      system,
      user,
      model,
      schema: { name: "impact_agent_output", schema }
    });
    const data = normalizeImpact(result.data, fallback);
    return {
      model,
      data,
      trace: {
        agent: "Impact Agent",
        input: `${mode} | ${entities.length} entities`,
        outputSummary: `Impact Agent calculated ${Math.round(data.upsideToday / 1000)}K of upside today against ${Math.round(data.atRiskRevenue / 1000)}K at risk.`,
        confidence: data.confidence
      }
    };
  } catch {
    return {
      model,
      data: fallback,
      trace: {
        agent: "Impact Agent",
        input: `${mode} | ${entities.length} entities`,
        outputSummary: `Impact Agent used deterministic calculations and found ${Math.round(fallback.upsideToday / 1000)}K of upside today.`,
        confidence: fallback.confidence
      }
    };
  }
}
