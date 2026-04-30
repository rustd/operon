import type {
  BusinessEntity,
  CompanyProfile,
  DataModelOutput,
  Decision,
  ImpactOutput,
  IntentOutput,
  Persona,
  PersonaView,
  WorkflowOutput
} from "@/lib/types";

const sampleEntities: DataModelOutput["entities"] = [
  { name: "Stripe", type: "partner", value: 900000, probability: 0.72, risk: "low" },
  { name: "Plaid", type: "partner", value: 650000, probability: 0.61, risk: "medium" },
  { name: "NovaPay", type: "customer", value: 390000, probability: 0.38, risk: "high" },
  { name: "Brex", type: "partner", value: 480000, probability: 0.46, risk: "medium" },
  { name: "Mercury", type: "partner", value: 300000, probability: 0.57, risk: "low" },
  { name: "Renewal Playbook", type: "initiative", value: 420000, probability: 0.52, risk: "high" }
];

export function clampProbability(value: number): number {
  return Math.max(0.05, Math.min(0.98, Number(value.toFixed(2))));
}

export function expectedValue(entity: Pick<BusinessEntity, "value" | "probability">): number {
  return Math.round(entity.value * entity.probability);
}

export function buildFallbackIntent(prompt: string, mode: "generate" | "today" | "rewrite"): IntentOutput {
  const normalized = prompt.toLowerCase();
  const role = normalized.includes("partnership") ? "Head of Partnerships" : "Business Operator";
  const businessGoal = normalized.includes("renewal risk")
    ? "Maximize partner revenue while reducing renewal risk."
    : "Maximize revenue from partner deals and tell the team what to do next.";

  return {
    role,
    businessGoal,
    northStarMetric: mode === "today" ? "Expected revenue moved today" : "Risk-adjusted partner revenue",
    constraints: [
      "Engineering bandwidth is limited.",
      "Commercial and product decisions need to move faster.",
      "Renewal risk should be surfaced before it slips revenue."
    ],
    personaAssumptions: [
      "Operator wants execution clarity.",
      "CFO wants risk-adjusted revenue visibility.",
      "CPTO wants clear tradeoffs for engineering time."
    ]
  };
}

export function buildFallbackDataModel(intent: IntentOutput): DataModelOutput {
  return {
    entities: sampleEntities,
    stages: ["High Value", "Blocked", "At Risk", "Launching"],
    metrics: [
      intent.northStarMetric,
      "Pipeline value",
      "At-risk revenue",
      "Expected value by partner"
    ],
    relationships: [
      "Stripe depends on one engineering integration blocker.",
      "Plaid depends on a contract clause and pricing alignment.",
      "NovaPay depends on renewal-risk escalation and champion recovery.",
      "Brex depends on launch readiness and partner engineering support."
    ]
  };
}

export function buildFallbackWorkflow(mode: "generate" | "today" | "rewrite"): WorkflowOutput {
  const todayFocus = mode === "today" || mode === "rewrite";

  return {
    pipelineStages: ["High Value", "Blocked", "At Risk", "Launching"],
    workflowStates: [
      "Qualify revenue impact",
      "Clear blockers",
      "Protect renewals",
      "Launch high-value partners"
    ],
    entityUpdates: [
      {
        name: "Stripe",
        stage: "High Value",
        blocker: "One engineering integration blocker remains.",
        nextAction: todayFocus
          ? "Assign one engineer and run the Stripe launch review today."
          : "Lock implementation owner and unblock launch support."
      },
      {
        name: "Plaid",
        stage: "Blocked",
        blocker: "Pricing clause is still unresolved.",
        nextAction: todayFocus
          ? "Fix the Plaid contract clause before end of day."
          : "Close pricing floor and expansion language with finance."
      },
      {
        name: "NovaPay",
        stage: "At Risk",
        blocker: "Renewal champion left and compliance risk is open.",
        nextAction: todayFocus
          ? "Escalate NovaPay risk to leadership immediately."
          : "Create a renewal rescue plan with risk and legal."
      },
      {
        name: "Brex",
        stage: "Blocked",
        blocker: "Launch checklist is missing product signoff.",
        nextAction: "Resolve the final product dependency for launch."
      },
      {
        name: "Mercury",
        stage: "Launching",
        blocker: "Partner marketing assets need final approval.",
        nextAction: "Ship co-launch assets and confirm launch date."
      },
      {
        name: "Renewal Playbook",
        stage: "At Risk",
        blocker: "No team owns systematic renewal escalation yet.",
        nextAction: todayFocus
          ? "Stop low-value work and move two engineering weeks into renewal tooling."
          : "Create a lightweight renewal-risk workflow."
      }
    ]
  };
}

export function mergeEntities(
  model: DataModelOutput,
  workflow: WorkflowOutput,
  currentEntities?: BusinessEntity[]
): BusinessEntity[] {
  const entityMap = new Map(currentEntities?.map((entity) => [entity.name, entity]));

  return model.entities.map((entity) => {
    const update = workflow.entityUpdates.find((item) => item.name === entity.name);
    const current = entityMap.get(entity.name);

    return {
      name: entity.name,
      type: entity.type,
      value: current?.value ?? entity.value,
      probability: clampProbability(current?.probability ?? entity.probability),
      risk: current?.risk ?? entity.risk,
      stage: update?.stage ?? current?.stage ?? "High Value",
      blocker: update?.blocker ?? current?.blocker ?? "No blocker",
      nextAction: update?.nextAction ?? current?.nextAction ?? "Review next step"
    };
  });
}

export function buildFallbackDecisions(mode: "generate" | "today" | "rewrite"): Decision[] {
  const todayFocus = mode === "today" || mode === "rewrite";

  return [
    {
      title: "Prioritize Stripe integration",
      why: "Stripe has the highest expected value and only one engineering blocker.",
      impact: todayFocus ? "+$900K expected value" : "Unlocks the largest clean revenue opportunity",
      owner: "Partnerships + Engineering",
      urgency: "today"
    },
    {
      title: "Fix Plaid contract clause",
      why: "Plaid is close to closing, but the pricing clause is the only blocker protecting margin and timing.",
      impact: todayFocus ? "+$650K protected" : "Protects near-term revenue and pricing quality",
      owner: "Finance + Partnerships",
      urgency: "today"
    },
    {
      title: "Escalate NovaPay renewal risk",
      why: "NovaPay has $390K exposed and the champion left, so delay compounds downside quickly.",
      impact: todayFocus ? "$390K saved" : "Reduces renewal slippage and compliance exposure",
      owner: "Risk + Partnerships",
      urgency: "today"
    },
    {
      title: "Stop low-value partner work",
      why: "Low-conviction asks are consuming engineering time that should go to launch and renewal protection.",
      impact: "Frees 2 engineering weeks",
      owner: "CPTO",
      urgency: todayFocus ? "today" : "this_week"
    }
  ];
}

export function calculateImpact(
  entities: BusinessEntity[],
  decisions: Decision[],
  mode: "generate" | "today" | "rewrite"
): ImpactOutput {
  const pipelineValue = entities.reduce((sum, entity) => sum + entity.value, 0);
  const atRiskRevenue = entities
    .filter((entity) => entity.risk === "high")
    .reduce((sum, entity) => sum + entity.value, 0);

  const todayEntityNames = new Set(
    decisions
      .filter((decision) => decision.urgency === "today")
      .flatMap((decision) =>
        entities
          .filter((entity) => decision.title.toLowerCase().includes(entity.name.toLowerCase()))
          .map((entity) => entity.name)
      )
  );

  const upsidePool = entities
    .filter((entity) => todayEntityNames.has(entity.name))
    .reduce((sum, entity) => sum + expectedValue(entity), 0);

  const upsideToday = Math.min(mode === "generate" ? 360000 : 420000, Math.round(upsidePool * 0.55));
  const confidenceBase =
    entities.reduce((sum, entity) => sum + entity.probability, 0) / Math.max(entities.length, 1);
  const confidence = Number(Math.min(0.94, Math.max(0.58, confidenceBase + (mode === "today" ? 0.08 : 0.02))).toFixed(2));

  if (mode === "today") {
    return {
      pipelineValue,
      atRiskRevenue: Math.max(390000, atRiskRevenue - 420000),
      upsideToday,
      confidence,
      before: {
        pipelineValue: 1100000,
        atRiskRevenue: 810000,
        upsideToday: 0
      },
      after: {
        pipelineValue: 1520000,
        atRiskRevenue: Math.max(390000, atRiskRevenue - 420000),
        upsideToday
      }
    };
  }

  return {
    pipelineValue,
    atRiskRevenue,
    upsideToday,
    confidence
  };
}

export function buildFallbackPersonaView(
  persona: Persona,
  company: CompanyProfile,
  entities: BusinessEntity[],
  decisions: Decision[],
  mode: "generate" | "today" | "rewrite"
): PersonaView {
  const topRevenue = [...entities]
    .sort((a, b) => expectedValue(b) - expectedValue(a))
    .slice(0, 3);
  const todaySummary = mode === "today" ? "Optimized for revenue impact today." : company.businessGoal;

  if (persona === "operator") {
    return {
      title: "Operator view",
      summary: todaySummary,
      sections: [
        {
          title: "Execution pipeline",
          items: entities.map((entity) => `${entity.name}: ${entity.stage}`)
        },
        {
          title: "Next actions",
          items: entities.slice(0, 4).map((entity) => `${entity.name}: ${entity.nextAction}`)
        },
        {
          title: "Launch blockers",
          items: entities
            .filter((entity) => entity.blocker !== "No blocker")
            .slice(0, 4)
            .map((entity) => `${entity.name}: ${entity.blocker}`)
        }
      ]
    };
  }

  if (persona === "cfo") {
    return {
      title: "CFO view",
      summary: todaySummary,
      sections: [
        {
          title: "Revenue forecast",
          items: topRevenue.map(
            (entity) => `${entity.name}: $${Math.round(expectedValue(entity) / 1000)}K expected value`
          )
        },
        {
          title: "Risk exposure",
          items: entities
            .filter((entity) => entity.risk !== "low")
            .map((entity) => `${entity.name}: ${entity.risk} risk`)
        },
        {
          title: "Upside today",
          items: decisions.slice(0, 3).map((decision) => `${decision.title}: ${decision.impact}`)
        }
      ]
    };
  }

  return {
    title: "CPTO view",
    summary: todaySummary,
    sections: [
      {
        title: "Tradeoffs",
        items: [
          "Move engineering time from low-value partner asks into launch and renewal work.",
          "Standardize integrations where revenue concentration is highest.",
          "Use risk gates to prevent expensive custom work."
        ]
      },
      {
        title: "Resource allocation",
        items: decisions.slice(0, 3).map((decision) => `${decision.owner}: ${decision.title}`)
      },
      {
        title: "What to stop doing",
        items: [
          "Stop custom partner asks with no live revenue.",
          "Stop delaying blocker resolution to weekly meetings.",
          "Stop spreading engineering time across low-probability deals."
        ]
      }
    ]
  };
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2).replace(/\.00$/, "")}M`;
  }

  return `$${Math.round(value / 1000)}K`;
}
