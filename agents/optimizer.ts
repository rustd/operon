import { callOpenAIJson } from "@/lib/openai";
import type { AgentTrace, InterpreterOutput, OptimizerOutput } from "@/lib/types";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    priorities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          rationale: { type: "string" },
          weight: { type: "number" }
        },
        required: ["label", "rationale", "weight"]
      }
    },
    decision_logic: { type: "string" },
    ranking_function: { type: "string" },
    scoring_rules: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          formula: { type: "string" }
        },
        required: ["name", "description", "formula"]
      }
    },
    scenario_bias: {
      type: "object",
      additionalProperties: false,
      properties: {
        growth: { type: "number" },
        margin: { type: "number" },
        risk: { type: "number" },
        velocity: { type: "number" }
      },
      required: ["growth", "margin", "risk", "velocity"]
    }
  },
  required: [
    "priorities",
    "decision_logic",
    "ranking_function",
    "scoring_rules",
    "scenario_bias"
  ]
} as const;

function fallback(input: InterpreterOutput, feedback?: string): OptimizerOutput {
  const revenueTodayFocus =
    feedback?.toLowerCase().includes("today") && feedback.toLowerCase().includes("revenue");

  return {
    priorities: revenueTodayFocus
      ? [
          {
            label: "Maximize revenue moved today",
            rationale: "Push executive attention and engineering capacity toward actions that change this month's number immediately.",
            weight: 0.42
          },
          {
            label: "Protect revenue already in motion",
            rationale: "Use contract clauses and launch readiness to keep likely deals from slipping.",
            weight: 0.24
          },
          {
            label: "Escalate risk only where it protects material upside",
            rationale: "Risk work should defend revenue, not create abstract process drag.",
            weight: 0.2
          },
          {
            label: "Stop low-yield partner work",
            rationale: "Free operator and engineering cycles from activities that do not move revenue today.",
            weight: 0.14
          }
        ]
      : [
          {
            label: "Concentrate on high-probability strategic revenue",
            rationale: "The system should bias toward large opportunities that can close with manageable implementation load.",
            weight: 0.38
          },
          {
            label: "Preserve margin and prevent discount sprawl",
            rationale: "Revenue quality matters as much as top-line expansion.",
            weight: 0.24
          },
          {
            label: "Gate risk before acceleration",
            rationale: "High-risk deals should not absorb the same operating energy as clean expansion plays.",
            weight: 0.23
          },
          {
            label: "Shorten executive decision latency",
            rationale: "Operator throughput improves when the OS reduces waiting on leadership alignment.",
            weight: 0.15
          }
        ],
    decision_logic: revenueTodayFocus
      ? "Re-rank the business around expected revenue moved today, revenue protected from slip, and engineering time freed for partner activation."
      : `Optimize around ${input.metrics.slice(0, 3).join(", ")} while penalizing concentrated downside and staffing drag.`,
    ranking_function: revenueTodayFocus
      ? "score = revenueMovedToday + revenueProtectedToday + executionCapacityFreed - unmanagedRisk - distractionCost"
      : "score = (value * winProbability * strategicFit * growthWeight) - (riskScore * riskWeight) - executionPenalty + velocityBonus",
    scoring_rules: [
      {
        name: "Expected value pressure",
        description: "Increase ranking when deal size and win confidence rise together.",
        formula: "value * winProbability"
      },
      {
        name: "Strategic fit multiplier",
        description: "Lift accounts that unlock downstream distribution or product leverage.",
        formula: "baseScore * strategicFit"
      },
      {
        name: "Risk brake",
        description: "Suppress deals with unresolved compliance or concentration risk.",
        formula: "baseScore - (riskScore * 1000000)"
      }
    ],
    scenario_bias: {
      growth: revenueTodayFocus ? 0.44 : 0.35,
      margin: revenueTodayFocus ? 0.18 : 0.23,
      risk: revenueTodayFocus ? 0.18 : 0.25,
      velocity: revenueTodayFocus ? 0.2 : 0.17
    }
  };
}

export async function runOptimizerAgent(input: InterpreterOutput, feedback?: string): Promise<{
  model: string;
  data: OptimizerOutput;
  trace: AgentTrace;
}> {
  const modelName = process.env.OPENAI_OPTIMIZER_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const system =
    "You are Agent 2, the Business Optimizer. Convert a business operating model into objective priorities, decision logic, and ranking rules. Return only JSON.";
  const user = `Interpreter output:\n${JSON.stringify(
    input,
    null,
    2
  )}\n\nOperator feedback:\n${feedback ?? "No additional feedback yet."}\n\nDefine business priorities, a decision logic narrative, a ranking function, and explicit scoring rules for a business OS. If feedback asks for today's highest-leverage revenue moves, aggressively re-rank for actions that move or protect revenue immediately.`;

  try {
    const result = await callOpenAIJson<OptimizerOutput>({
      system,
      user,
      schema: {
        name: "optimizer_output",
        schema
      },
      model: modelName
    });

    return {
      model: result.model,
      data: result.data,
      trace: {
        agent: "optimizer",
        promptSummary: "Turned the interpreted business intent into weighted optimization logic.",
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
        agent: "optimizer",
        promptSummary: "Used fallback optimization rules to keep the business OS operational locally.",
        usedLiveLLM: false,
        provider: "Local fallback",
        model: modelName,
        output: data
      }
    };
  }
}
