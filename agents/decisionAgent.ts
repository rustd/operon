import { buildFallbackDecisions } from "@/lib/demoData";
import { callOpenAIJson } from "@/lib/openai";
import type {
  AgentResult,
  BusinessEntity,
  Decision,
  IntentOutput,
  Persona,
  RunMode,
  WorkflowOutput
} from "@/lib/types";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          why: { type: "string" },
          impact: { type: "string" },
          owner: { type: "string" },
          urgency: { type: "string", enum: ["today", "this_week", "later"] }
        },
        required: ["title", "why", "impact", "owner", "urgency"]
      }
    }
  },
  required: ["decisions"]
} as const;

function normalizeDecisions(data: { decisions: Decision[] }, fallback: Decision[]): Decision[] {
  return data.decisions?.length ? data.decisions.slice(0, 5) : fallback;
}

export async function runDecisionAgent({
  intent,
  entities,
  workflow,
  persona,
  mode
}: {
  intent: IntentOutput;
  entities: BusinessEntity[];
  workflow: WorkflowOutput;
  persona: Persona;
  mode: RunMode;
}): Promise<AgentResult<Decision[]>> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const fallback = buildFallbackDecisions(mode);
  const system =
    "You are the Decision Agent for Operon. Prioritize specific business decisions with clear owners, urgency, and business impact. Return valid JSON only.";
  const user = JSON.stringify({
    task: "Return the top decisions for this business system. The decisions must be specific, executive-ready, and grounded in the entities and blockers provided.",
    persona,
    mode,
    intent,
    entities,
    workflow
  });

  try {
    const result = await callOpenAIJson<{ decisions: Decision[] }>({
      system,
      user,
      model,
      schema: { name: "decision_agent_output", schema }
    });
    const data = normalizeDecisions(result.data, fallback);
    return {
      model,
      data,
      trace: {
        agent: "Decision Agent",
        input: `${persona} | ${mode}`,
        outputSummary: `Decision Agent prioritized ${data[0]?.title ?? "the top revenue move"} and ranked the work by business impact.`,
        confidence: 0.86
      }
    };
  } catch {
    return {
      model,
      data: fallback,
      trace: {
        agent: "Decision Agent",
        input: `${persona} | ${mode}`,
        outputSummary: "Decision Agent fell back to the deterministic ranking that emphasizes Stripe, Plaid, NovaPay, and engineering focus.",
        confidence: 0.74
      }
    };
  }
}
