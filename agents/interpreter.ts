import { callOpenAIJson } from "@/lib/openai";
import type { AgentTrace, InterpreterOutput } from "@/lib/types";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    role: { type: "string" },
    sector: { type: "string" },
    operatingStyle: { type: "string" },
    goals: { type: "array", items: { type: "string" } },
    metrics: { type: "array", items: { type: "string" } },
    entities: { type: "array", items: { type: "string" } },
    constraints: { type: "array", items: { type: "string" } },
    opportunities: { type: "array", items: { type: "string" } }
  },
  required: [
    "role",
    "sector",
    "operatingStyle",
    "goals",
    "metrics",
    "entities",
    "constraints",
    "opportunities"
  ]
} as const;

function fallback(prompt: string, feedback?: string): InterpreterOutput {
  const normalized = `${prompt} ${feedback ?? ""}`.toLowerCase();

  return {
    role: normalized.includes("partnership")
      ? "Head of Partnerships"
      : "Business Operator",
    sector: normalized.includes("fintech") ? "Fintech" : "B2B SaaS",
    operatingStyle: "Outcome-first operating system with decision velocity bias",
    goals: [
      "Prioritize the highest-value strategic opportunities",
      "Accelerate revenue without absorbing unmanaged risk",
      feedback?.toLowerCase().includes("today")
        ? "Show the highest-leverage actions for today before broader planning work"
        : "Make executive tradeoffs visible before resources are committed"
    ],
    metrics: [
      "Weighted pipeline value",
      "Gross margin preservation",
      "Risk-adjusted expected value",
      "Time-to-decision"
    ],
    entities: ["Accounts", "Deals", "Risks", "Executives", "Decision Gates"],
    constraints: [
      "Limited implementation bandwidth",
      "Need for executive alignment across commercial and product teams",
      "Exposure to compliance and pricing risk"
    ],
    opportunities: feedback?.toLowerCase().includes("maximize revenue")
      ? [
          "Concentrate time on revenue-protecting actions that move this month's number",
          "Convert partner work into explicit owner queues for today",
          "Rewrite the interface around daily revenue decisions instead of passive reporting"
        ]
      : [
          "Concentrate effort on deals with strategic pull and short payback",
          "Use scenario simulation to avoid low-quality expansion",
          "Rewrite workflows around the current operator persona"
        ]
  };
}

export async function runInterpreterAgent(prompt: string, feedback?: string): Promise<{
  model: string;
  data: InterpreterOutput;
  trace: AgentTrace;
}> {
  const modelName = process.env.OPENAI_INTERPRETER_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const system =
    "You are Agent 1, the Interpreter for a Dynamic Business OS. Translate an operator's free-form business prompt into a precise operating model. Return only JSON.";
  const user = `Business prompt:\n${prompt}\n\nOperator feedback:\n${
    feedback ?? "No additional feedback yet."
  }\n\nExtract the business role, sector, goals, metrics, entities, constraints, and opportunities the OS should optimize around.`;

  try {
    const result = await callOpenAIJson<InterpreterOutput>({
      system,
      user,
      schema: {
        name: "interpreter_output",
        schema
      },
      model: modelName
    });

    return {
      model: result.model,
      data: result.data,
      trace: {
        agent: "interpreter",
        promptSummary: "Converted the user's prompt into a typed business operating model.",
        usedLiveLLM: true,
        provider: result.provider,
        model: result.model,
        output: result.data
      }
    };
  } catch {
    const data = fallback(prompt, feedback);
    return {
      model: modelName,
      data,
      trace: {
        agent: "interpreter",
        promptSummary: "Fell back to a deterministic interpreter profile because live LLM access was unavailable.",
        usedLiveLLM: false,
        provider: "Local fallback",
        model: modelName,
        output: data
      }
    };
  }
}
