import { callOpenAIJson } from "@/lib/openai";
import type { AgentTrace, OptimizerOutput, UIOutput } from "@/lib/types";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    layout: { type: "string", enum: ["kanban", "table", "exec"] },
    persona_modes: {
      type: "object",
      additionalProperties: false,
      properties: {
        operator: {
          $ref: "#/$defs/personaMode"
        },
        cfo: {
          $ref: "#/$defs/personaMode"
        },
        cpto: {
          $ref: "#/$defs/personaMode"
        }
      },
      required: ["operator", "cfo", "cpto"]
    }
  },
  required: ["layout", "persona_modes"],
  $defs: {
    personaMode: {
      type: "object",
      additionalProperties: false,
      properties: {
        headline: { type: "string" },
        stance: { type: "string" },
        components: {
          type: "array",
          items: {
            type: "object"
          }
        }
      },
      required: ["headline", "stance", "components"]
    }
  }
} as const;

function fallback(input: OptimizerOutput, feedback?: string): UIOutput {
  const rewriteFocus = feedback?.toLowerCase().includes("today") ?? false;
  return {
    layout: "kanban",
    persona_modes: {
      operator: {
        headline: rewriteFocus ? "Operator view, re-ranked for today" : "Operator View",
        stance: rewriteFocus
          ? "See the revenue moves that matter now, the blockers in the way, and the work to stop."
          : "See the live pipeline, blockers, and next actions.",
        components: [
          {
            type: "hero",
            kicker: rewriteFocus ? "Today's revenue moves" : "Pipeline control",
            title: rewriteFocus ? "Move revenue today" : "Run the operating system, not the spreadsheet",
            subtitle: input.decision_logic
          },
          {
            type: "board",
            title: "Execution pipeline",
            columns: [
              { title: "Push Now", cards: ["Stripe executive sync", "Reserve onboarding pod"] },
              { title: "Structure Harder", cards: ["Plaid margin guardrails", "Expansion pricing memo"] },
              { title: "Hold Gate", cards: ["NovaPay compliance signoff"] }
            ]
          },
          {
            type: "decision_list",
            title: "System priorities",
            items: input.priorities.map((priority) => ({
              title: priority.label,
              detail: priority.rationale,
              emphasis: "high"
            }))
          }
        ]
      },
      cfo: {
        headline: "CFO View",
        stance: "Assess revenue quality, downside, and capital efficiency.",
        components: [
          {
            type: "hero",
            kicker: "Capital allocation",
            title: "Revenue without undisciplined exposure",
            subtitle: "The OS ranks opportunities by expected value, margin protection, and risk containment."
          },
          {
            type: "metric_strip",
            items: [
              { label: "Revenue bias", value: `${Math.round(input.scenario_bias.growth * 100)}%`, tone: "good" },
              { label: "Margin guard", value: `${Math.round(input.scenario_bias.margin * 100)}%`, tone: "warn" },
              { label: "Risk brake", value: `${Math.round(input.scenario_bias.risk * 100)}%`, tone: "danger" }
            ]
          },
          {
            type: "table",
            title: "Scoring rules",
            columns: ["Rule", "Why it matters", "Formula"],
            rows: input.scoring_rules.map((rule) => [rule.name, rule.description, rule.formula])
          }
        ]
      },
      cpto: {
        headline: "CPTO View",
        stance: "Turn demand into product and technical choices with visible tradeoffs.",
        components: [
          {
            type: "hero",
            kicker: "Product leverage",
            title: "What should product enable versus refuse?",
            subtitle: "The OS exposes where product effort unlocks revenue and where it merely absorbs risk."
          },
          {
            type: "narrative",
            title: "Decision engine posture",
            body: input.ranking_function
          },
          {
            type: "decision_list",
            title: "Product-facing levers",
            items: [
              {
                title: "Standardize implementation tiers",
                detail: "Reduce custom work so strategic accounts move faster without starving the roadmap.",
                emphasis: "high"
              },
              {
                title: "Create compliance gating templates",
                detail: "Handle NovaPay-like risk earlier in the process.",
                emphasis: "medium"
              }
            ]
          }
        ]
      }
    }
  };
}

export async function runUiAgent(input: OptimizerOutput, feedback?: string): Promise<{
  model: string;
  data: UIOutput;
  trace: AgentTrace;
}> {
  const modelName = process.env.OPENAI_UI_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const system =
    "You are Agent 3, the UI Generator for a Dynamic Business OS. Produce a persona-aware UI schema for Operator, CFO, and CPTO views. Return only JSON.";
  const user = `Optimizer output:\n${JSON.stringify(
    input,
    null,
    2
  )}\n\nOperator feedback:\n${feedback ?? "No additional feedback yet."}\n\nCreate a dynamic UI schema that changes presentation by persona and emphasizes business decisions rather than dashboards.`;

  try {
    const result = await callOpenAIJson<UIOutput>({
      system,
      user,
      schema: {
        name: "ui_output",
        schema
      },
      model: modelName
    });

    return {
      model: result.model,
      data: result.data,
      trace: {
        agent: "ui",
        promptSummary: "Generated a persona-aware UI schema instead of a static screen layout.",
        usedLiveLLM: true,
        provider: result.provider,
        model: result.model,
        output: result.data
      }
    };
  } catch {
    const data = fallback(input, feedback);
    return {
      model: modelName,
      data,
      trace: {
        agent: "ui",
        promptSummary: "Used a local schema generator so the app can still rewrite itself without live API access.",
        usedLiveLLM: false,
        provider: "Local fallback",
        model: modelName,
        output: data
      }
    };
  }
}
