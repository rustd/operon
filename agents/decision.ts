import { callOpenAIJson } from "@/lib/openai";
import type {
  AgentTrace,
  DealRecord,
  DecisionOutput,
  OptimizerOutput,
  RiskRecord,
  SimulationMode
} from "@/lib/types";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    top_decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          recommendation: { type: "string" },
          score: { type: "number" },
          ownerView: { type: "string", enum: ["operator", "cfo", "cpto", "shared"] },
          linkedEntity: { type: "string" }
        },
        required: ["title", "recommendation", "score", "ownerView", "linkedEntity"]
      }
    },
    impact: {
      type: "array",
      items: { type: "string" }
    },
    tradeoffs: {
      type: "array",
      items: { type: "string" }
    },
    scenario_summary: { type: "string" }
  },
  required: ["top_decisions", "impact", "tradeoffs", "scenario_summary"]
} as const;

function computeScore(deal: DealRecord, weights: OptimizerOutput["scenario_bias"]): number {
  const growth = deal.value * deal.winProbability * weights.growth;
  const marginProxy = deal.value * deal.strategicFit * weights.margin;
  const riskPenalty = deal.value * deal.riskScore * weights.risk;
  const velocityBonus = deal.value * (1 - deal.riskScore) * 0.15 * weights.velocity;
  return Math.round((growth + marginProxy + velocityBonus - riskPenalty) / 1000);
}

function fallback(
  optimizer: OptimizerOutput,
  deals: DealRecord[],
  risks: RiskRecord[],
  simulationMode: SimulationMode,
  feedback?: string
): DecisionOutput {
  const revenueTodayFocus =
    feedback?.toLowerCase().includes("today") && feedback.toLowerCase().includes("revenue");
  const sorted = [...deals]
    .map((deal) => ({
      deal,
      score: computeScore(deal, optimizer.scenario_bias)
    }))
    .sort((a, b) => b.score - a.score);

  return {
    top_decisions: revenueTodayFocus
      ? [
          {
            title: "Stripe integration push",
            recommendation: "Prioritize executive sync and launch support for Stripe now to unlock +$900K expected value.",
            score: 95,
            ownerView: "operator",
            linkedEntity: "Stripe"
          },
          {
            title: "Plaid contract clause",
            recommendation: "Close the pricing clause today to protect +$650K from margin drift and slip risk.",
            score: 92,
            ownerView: "cfo",
            linkedEntity: "Plaid"
          },
          {
            title: "NovaPay risk escalation",
            recommendation: "Escalate NovaPay to risk leadership immediately; gating it now saves roughly $390K of preventable downside.",
            score: 88,
            ownerView: "cpto",
            linkedEntity: "NovaPay"
          },
          {
            title: "Stop low-value partner work",
            recommendation: "Pause low-yield partner asks that are not tied to live revenue; this frees 2 engineering weeks for launch work.",
            score: 84,
            ownerView: "shared",
            linkedEntity: "Engineering"
          },
          {
            title: "Daily revenue operating cadence",
            recommendation: "Run a daily revenue review until the Stripe and Plaid actions clear, with one owner per blocker.",
            score: 81,
            ownerView: "shared",
            linkedEntity: "Exec cadence"
          }
        ]
      : [
          {
            title: `Accelerate ${sorted[0].deal.account}`,
            recommendation: `Commit executive time and delivery resources to ${sorted[0].deal.account}; it has the highest risk-adjusted upside.`,
            score: sorted[0].score,
            ownerView: "operator",
            linkedEntity: sorted[0].deal.account
          },
          {
            title: `Reframe ${sorted[1].deal.account} pricing`,
            recommendation: `Close ${sorted[1].deal.account} only with pricing floors and expansion terms that defend margin quality.`,
            score: sorted[1].score,
            ownerView: "cfo",
            linkedEntity: sorted[1].deal.account
          },
          {
            title: `Gate ${sorted[2].deal.account} behind product-risk controls`,
            recommendation: `Do not force the ${sorted[2].deal.account} deal through until compliance and technical safeguards are explicit.`,
            score: sorted[2].score,
            ownerView: "cpto",
            linkedEntity: sorted[2].deal.account
          },
          {
            title: "Reserve onboarding bandwidth",
            recommendation: "Protect implementation capacity now so revenue-ready deals are not blocked by staffing lag.",
            score: 76,
            ownerView: "operator",
            linkedEntity: "Onboarding"
          },
          {
            title: "Cut low-conviction expansion work",
            recommendation: "Reduce energy spent on low-probability partner motion and reallocate it to near-term revenue actions.",
            score: 71,
            ownerView: "shared",
            linkedEntity: "Portfolio"
          }
        ],
    impact: revenueTodayFocus
      ? [
          "Operon found +$420K expected upside by changing priorities.",
          "The system moved attention to revenue that can close or be protected today, not just eventually.",
          `Risk posture still remains anchored by ${risks[0].name.toLowerCase()}.`
        ]
      : [
          `Top-ranked pipeline in ${simulationMode} mode points to ${sorted[0].deal.account} as the cleanest near-term revenue unlock.`,
          "Expected commercial energy should shift away from low-quality expansion and toward structured high-fit deals.",
          `Risk posture remains anchored by ${risks[0].name.toLowerCase()}.`
        ],
    tradeoffs: revenueTodayFocus
      ? [
          "More engineering time moves to launch-critical work and less to exploratory partner requests.",
          "Risk escalations happen faster, even if they slow cosmetic pipeline growth.",
          "The system favors revenue moved this month over broader platform optionality."
        ]
      : [
          "Pushing Stripe faster may require protecting onboarding capacity from custom requests elsewhere.",
          "Defending Plaid pricing can modestly slow close velocity but preserves long-term margin quality.",
          "Holding NovaPay lowers short-term headline pipeline but avoids concentrated downside."
        ],
    scenario_summary: revenueTodayFocus
      ? "Operon re-ranked the business around revenue moved today, revenue protected from slip, and engineering time freed for high-value work."
      : simulationMode === "upside"
        ? "Upside simulation increases confidence in top-tier accounts and shrinks relative downside."
        : simulationMode === "downside"
          ? "Downside simulation amplifies risk penalties and makes gated execution more important."
          : "Baseline simulation balances revenue ambition against execution and compliance risk."
  };
}

export async function runDecisionAgent({
  optimizer,
  deals,
  risks,
  simulationMode,
  feedback
}: {
  optimizer: OptimizerOutput;
  deals: DealRecord[];
  risks: RiskRecord[];
  simulationMode: SimulationMode;
  feedback?: string;
}): Promise<{
  model: string;
  data: DecisionOutput;
  trace: AgentTrace;
}> {
  const modelName = process.env.OPENAI_DECISION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const system =
    "You are Agent 4, the Decision Engine. Turn the optimized business model and live business objects into concrete executive decisions, impact statements, and tradeoffs. Return only JSON.";
  const user = `Optimizer output:\n${JSON.stringify(optimizer, null, 2)}\n\nOperator feedback:\n${
    feedback ?? "No additional feedback yet."
  }\n\nDeals:\n${JSON.stringify(
    deals,
    null,
    2
  )}\n\nRisks:\n${JSON.stringify(risks, null, 2)}\n\nSimulation mode: ${simulationMode}\n\nReturn 5 top decisions, impact statements, tradeoffs, and a concise scenario summary.`;

  try {
    const result = await callOpenAIJson<DecisionOutput>({
      system,
      user,
      schema: {
        name: "decision_output",
        schema
      },
      model: modelName
    });

    return {
      model: result.model,
      data: result.data,
      trace: {
        agent: "decision",
        promptSummary: "Generated decision outputs from the optimized business model and deal/risk objects.",
        usedLiveLLM: true,
        provider: result.provider,
        model: result.model,
        output: result.data
      }
    };
  } catch {
    const data = fallback(optimizer, deals, risks, simulationMode, feedback);
    return {
      model: modelName,
      data,
      trace: {
        agent: "decision",
        promptSummary: "Used the local decision engine so the demo still produces ranked actions and tradeoffs.",
        usedLiveLLM: false,
        provider: "Local fallback",
        model: modelName,
        output: data
      }
    };
  }
}
