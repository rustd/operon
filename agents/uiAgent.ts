import { buildFallbackPersonaView } from "@/lib/demoData";
import { callOpenAIJson } from "@/lib/openai";
import type {
  AgentResult,
  BusinessEntity,
  CompanyProfile,
  Decision,
  Persona,
  PersonaView,
  RunMode
} from "@/lib/types";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          items: { type: "array", items: { type: "string" } }
        },
        required: ["title", "items"]
      }
    }
  },
  required: ["title", "summary", "sections"]
} as const;

function normalizePersonaView(data: PersonaView, fallback: PersonaView): PersonaView {
  return {
    title: data.title || fallback.title,
    summary: data.summary || fallback.summary,
    sections: data.sections?.length ? data.sections.slice(0, 4) : fallback.sections
  };
}

export async function runUiAgent({
  persona,
  company,
  entities,
  decisions,
  mode
}: {
  persona: Persona;
  company: CompanyProfile;
  entities: BusinessEntity[];
  decisions: Decision[];
  mode: RunMode;
}): Promise<AgentResult<PersonaView>> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const fallback = buildFallbackPersonaView(persona, company, entities, decisions, mode);
  const system =
    "You are the UI Agent for Operon. Decide what the interface should emphasize for a single persona. Return valid JSON only.";
  const user = JSON.stringify({
    task: "Generate the personaView object. Emphasize Operator execution, CFO revenue/risk, or CPTO tradeoffs.",
    persona,
    mode,
    company,
    entities,
    decisions
  });

  try {
    const result = await callOpenAIJson<PersonaView>({
      system,
      user,
      model,
      schema: { name: "ui_agent_output", schema }
    });
    const data = normalizePersonaView(result.data, fallback);
    return {
      model,
      data,
      trace: {
        agent: "UI Agent",
        input: `${persona} | ${mode}`,
        outputSummary: `UI Agent emphasized ${persona === "operator" ? "execution workflow" : persona === "cfo" ? "revenue and risk" : "tradeoffs and resource allocation"} for the ${persona.toUpperCase()} view.`,
        confidence: 0.83
      }
    };
  } catch {
    return {
      model,
      data: fallback,
      trace: {
        agent: "UI Agent",
        input: `${persona} | ${mode}`,
        outputSummary: `UI Agent used the deterministic ${persona.toUpperCase()} view while keeping the interface generated from the outcome.`,
        confidence: 0.72
      }
    };
  }
}
