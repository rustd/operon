export type Persona = "operator" | "cfo" | "cpto";

export type InterpreterOutput = {
  role: string;
  sector: string;
  operatingStyle: string;
  goals: string[];
  metrics: string[];
  entities: string[];
  constraints: string[];
  opportunities: string[];
};

export type BusinessPriority = {
  label: string;
  rationale: string;
  weight: number;
};

export type DecisionRule = {
  name: string;
  description: string;
  formula: string;
};

export type OptimizerOutput = {
  priorities: BusinessPriority[];
  decision_logic: string;
  ranking_function: string;
  scoring_rules: DecisionRule[];
  scenario_bias: {
    growth: number;
    margin: number;
    risk: number;
    velocity: number;
  };
};

export type UIComponent =
  | {
      type: "hero";
      title: string;
      subtitle: string;
      kicker: string;
    }
  | {
      type: "metric_strip";
      items: Array<{ label: string; value: string; tone?: "default" | "good" | "warn" | "danger" }>;
    }
  | {
      type: "board";
      title: string;
      columns: Array<{ title: string; cards: string[] }>;
    }
  | {
      type: "decision_list";
      title: string;
      items: Array<{ title: string; detail: string; emphasis?: "high" | "medium" | "low" }>;
    }
  | {
      type: "table";
      title: string;
      columns: string[];
      rows: string[][];
    }
  | {
      type: "narrative";
      title: string;
      body: string;
    };

export type UIOutput = {
  layout: "kanban" | "table" | "exec";
  persona_modes: Record<
    Persona,
    {
      headline: string;
      stance: string;
      components: UIComponent[];
    }
  >;
};

export type DealRecord = {
  id: string;
  account: string;
  stage: string;
  value: number;
  winProbability: number;
  riskScore: number;
  strategicFit: number;
  blocker: string;
  owner: string;
};

export type RiskRecord = {
  name: string;
  severity: "low" | "medium" | "high";
  exposure: string;
  action: string;
};

export type DecisionItem = {
  title: string;
  recommendation: string;
  score: number;
  ownerView: Persona | "shared";
  linkedEntity: string;
};

export type DecisionOutput = {
  top_decisions: DecisionItem[];
  impact: string[];
  tradeoffs: string[];
  scenario_summary: string;
};

export type AgentTrace = {
  agent: "interpreter" | "optimizer" | "ui" | "decision";
  promptSummary: string;
  usedLiveLLM: boolean;
  provider?: string;
  model?: string;
  output: unknown;
};

export type SimulationMode = "baseline" | "upside" | "downside";

export type BusinessOSResponse = {
  prompt: string;
  feedback?: string;
  persona: Persona;
  simulationMode: SimulationMode;
  rewriteApplied: boolean;
  demoMode: boolean;
  modelPlan: Record<"interpreter" | "optimizer" | "ui" | "decision", string>;
  availableModels: string[];
  interpreter: InterpreterOutput;
  optimizer: OptimizerOutput;
  ui: UIOutput;
  decisions: DecisionOutput;
  deals: DealRecord[];
  risks: RiskRecord[];
  trace: AgentTrace[];
};
