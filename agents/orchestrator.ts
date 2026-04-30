import { runDataModelAgent } from "@/agents/dataModelAgent";
import { runDecisionAgent } from "@/agents/decisionAgent";
import { runImpactAgent } from "@/agents/impactAgent";
import { runIntentAgent } from "@/agents/intentAgent";
import { runUiAgent } from "@/agents/uiAgent";
import { runWorkflowAgent } from "@/agents/workflowAgent";
import { mergeEntities } from "@/lib/demoData";
import type { BusinessSystemResponse, RunBusinessRequest } from "@/lib/types";

export async function runBusinessSystem({
  prompt,
  persona,
  mode,
  currentState
}: RunBusinessRequest): Promise<BusinessSystemResponse> {
  const intent = await runIntentAgent(prompt, mode);
  const dataModel = await runDataModelAgent(intent.data);
  const workflow = await runWorkflowAgent({
    intent: intent.data,
    dataModel: dataModel.data,
    mode
  });

  const entities = mergeEntities(
    dataModel.data,
    workflow.data,
    Array.isArray(currentState?.entities) ? currentState.entities : undefined
  );

  const decision = await runDecisionAgent({
    intent: intent.data,
    entities,
    workflow: workflow.data,
    persona,
    mode
  });
  const impact = await runImpactAgent({
    entities,
    decisions: decision.data,
    mode
  });
  const ui = await runUiAgent({
    persona,
    company: {
      role: intent.data.role,
      businessGoal: intent.data.businessGoal,
      northStarMetric: intent.data.northStarMetric
    },
    entities,
    decisions: decision.data,
    mode
  });

  return {
    company: {
      role: intent.data.role,
      businessGoal: intent.data.businessGoal,
      northStarMetric: intent.data.northStarMetric
    },
    impact: {
      pipelineValue: impact.data.pipelineValue,
      atRiskRevenue: impact.data.atRiskRevenue,
      upsideToday: impact.data.upsideToday,
      confidence: impact.data.confidence
    },
    entities,
    decisions: decision.data,
    personaView: ui.data,
    agentTrace: [
      intent.trace,
      dataModel.trace,
      workflow.trace,
      decision.trace,
      ui.trace,
      impact.trace
    ]
  };
}
