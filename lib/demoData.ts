import type { DealRecord, RiskRecord, SimulationMode } from "@/lib/types";

const baseDeals: DealRecord[] = [
  {
    id: "stripe",
    account: "Stripe",
    stage: "Executive Alignment",
    value: 900000,
    winProbability: 0.72,
    riskScore: 0.24,
    strategicFit: 0.94,
    blocker: "Integration capacity on customer success side",
    owner: "Partnerships"
  },
  {
    id: "plaid",
    account: "Plaid",
    stage: "Commercial Review",
    value: 650000,
    winProbability: 0.61,
    riskScore: 0.31,
    strategicFit: 0.87,
    blocker: "Pricing complexity across multiple business units",
    owner: "Finance + Partnerships"
  },
  {
    id: "novapay",
    account: "NovaPay",
    stage: "Risk Committee",
    value: 440000,
    winProbability: 0.39,
    riskScore: 0.81,
    strategicFit: 0.69,
    blocker: "Unresolved compliance and concentration risk",
    owner: "Legal + Risk"
  }
];

export const baseRisks: RiskRecord[] = [
  {
    name: "NovaPay concentration risk",
    severity: "high",
    exposure: "Potential regulatory drag and payment-failure downside if fast-tracked",
    action: "Keep deal gated behind compliance milestones"
  },
  {
    name: "Implementation bandwidth",
    severity: "medium",
    exposure: "Stripe could stall without staffed onboarding",
    action: "Reserve launch pod capacity before signature"
  },
  {
    name: "Pricing sprawl",
    severity: "medium",
    exposure: "Plaid margin erodes if cross-unit discounting expands",
    action: "Lock a floor price and expansion clause"
  }
];

export function getScenarioDeals(simulationMode: SimulationMode): DealRecord[] {
  if (simulationMode === "upside") {
    return baseDeals.map((deal) => ({
      ...deal,
      value: Math.round(deal.value * 1.12),
      winProbability: Math.min(0.96, deal.winProbability + 0.08),
      riskScore: Math.max(0.08, deal.riskScore - 0.07)
    }));
  }

  if (simulationMode === "downside") {
    return baseDeals.map((deal) => ({
      ...deal,
      value: Math.round(deal.value * 0.9),
      winProbability: Math.max(0.18, deal.winProbability - 0.12),
      riskScore: Math.min(0.95, deal.riskScore + 0.09)
    }));
  }

  return baseDeals;
}
