export type Persona = "operator" | "cfo" | "cpto";

export type RunMode = "generate" | "today" | "rewrite";

export type EntityType = "partner" | "customer" | "initiative";

export type RiskLevel = "low" | "medium" | "high";

export type DecisionUrgency = "today" | "this_week" | "later";

export type CompanyProfile = {
  role: string;
  businessGoal: string;
  northStarMetric: string;
};

export type BusinessEntity = {
  name: string;
  type: EntityType;
  value: number;
  stage: string;
  risk: RiskLevel;
  blocker: string;
  nextAction: string;
  probability: number;
};

export type Decision = {
  title: string;
  why: string;
  impact: string;
  owner: string;
  urgency: DecisionUrgency;
};

export type PersonaViewSection = {
  title: string;
  items: string[];
};

export type PersonaView = {
  title: string;
  summary: string;
  sections: PersonaViewSection[];
};

export type AgentTrace = {
  agent: string;
  input: string;
  outputSummary: string;
  confidence: number;
};

export type BusinessSystemResponse = {
  company: CompanyProfile;
  impact: {
    pipelineValue: number;
    atRiskRevenue: number;
    upsideToday: number;
    confidence: number;
  };
  entities: BusinessEntity[];
  decisions: Decision[];
  personaView: PersonaView;
  agentTrace: AgentTrace[];
};

export type RunBusinessRequest = {
  prompt: string;
  persona: Persona;
  mode: RunMode;
  currentState?: Partial<BusinessSystemResponse> | null;
};

export type IntentOutput = CompanyProfile & {
  constraints: string[];
  personaAssumptions: string[];
};

export type DataModelOutput = {
  entities: Array<{
    name: string;
    type: EntityType;
    value: number;
    probability: number;
    risk: RiskLevel;
  }>;
  stages: string[];
  metrics: string[];
  relationships: string[];
};

export type WorkflowOutput = {
  pipelineStages: string[];
  workflowStates: string[];
  entityUpdates: Array<{
    name: string;
    stage: string;
    blocker: string;
    nextAction: string;
  }>;
};

export type ImpactOutput = BusinessSystemResponse["impact"] & {
  before?: {
    pipelineValue: number;
    atRiskRevenue: number;
    upsideToday: number;
  };
  after?: {
    pipelineValue: number;
    atRiskRevenue: number;
    upsideToday: number;
  };
};

export type AgentResult<T> = {
  data: T;
  trace: AgentTrace;
  model: string;
};
