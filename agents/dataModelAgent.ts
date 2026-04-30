import { buildFallbackDataModel, clampProbability } from "@/lib/demoData";
import { callOpenAIJson } from "@/lib/openai";
import type { AgentResult, DataModelOutput, IntentOutput } from "@/lib/types";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    entities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["partner", "customer", "initiative"] },
          value: { type: "number" },
          probability: { type: "number" },
          risk: { type: "string", enum: ["low", "medium", "high"] }
        },
        required: ["name", "type", "value", "probability", "risk"]
      }
    },
    stages: { type: "array", items: { type: "string" } },
    metrics: { type: "array", items: { type: "string" } },
    relationships: { type: "array", items: { type: "string" } }
  },
  required: ["entities", "stages", "metrics", "relationships"]
} as const;

function normalizeDataModel(data: DataModelOutput, fallback: DataModelOutput): DataModelOutput {
  return {
    entities:
      data.entities?.length > 0
        ? data.entities.slice(0, 8).map((entity) => ({
            ...entity,
            value: Math.max(50000, Math.round(entity.value)),
            probability: clampProbability(entity.probability)
          }))
        : fallback.entities,
    stages: data.stages?.length ? data.stages.slice(0, 6) : fallback.stages,
    metrics: data.metrics?.length ? data.metrics.slice(0, 6) : fallback.metrics,
    relationships: data.relationships?.length ? data.relationships.slice(0, 6) : fallback.relationships
  };
}

export async function runDataModelAgent(intent: IntentOutput): Promise<AgentResult<DataModelOutput>> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const fallback = buildFallbackDataModel(intent);
  const system =
    "You are the Data Model Agent for Operon. Create a business entity model with realistic commercial values and risk states. Return valid JSON only.";
  const user = JSON.stringify({
    task: "Generate entities, stages, metrics, and relationships for a business operating system.",
    intent
  });

  try {
    const result = await callOpenAIJson<DataModelOutput>({
      system,
      user,
      model,
      schema: { name: "data_model_agent_output", schema }
    });
    const data = normalizeDataModel(result.data, fallback);
    return {
      model,
      data,
      trace: {
        agent: "Data Model Agent",
        input: `${intent.role} | ${intent.businessGoal}`,
        outputSummary: `Data Model Agent generated ${data.entities.length} business entities and mapped the revenue model behind the system.`,
        confidence: 0.84
      }
    };
  } catch {
    return {
      model,
      data: fallback,
      trace: {
        agent: "Data Model Agent",
        input: `${intent.role} | ${intent.businessGoal}`,
        outputSummary: `Data Model Agent fell back to the fintech partnership dataset with Stripe, Plaid, NovaPay, Brex, and Mercury.`,
        confidence: 0.7
      }
    };
  }
}
