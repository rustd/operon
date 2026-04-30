import { buildFallbackWorkflow } from "@/lib/demoData";
import { callOpenAIJson } from "@/lib/openai";
import type { AgentResult, DataModelOutput, IntentOutput, RunMode, WorkflowOutput } from "@/lib/types";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pipelineStages: { type: "array", items: { type: "string" } },
    workflowStates: { type: "array", items: { type: "string" } },
    entityUpdates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          stage: { type: "string" },
          blocker: { type: "string" },
          nextAction: { type: "string" }
        },
        required: ["name", "stage", "blocker", "nextAction"]
      }
    }
  },
  required: ["pipelineStages", "workflowStates", "entityUpdates"]
} as const;

function normalizeWorkflow(data: WorkflowOutput, fallback: WorkflowOutput): WorkflowOutput {
  return {
    pipelineStages: data.pipelineStages?.length ? data.pipelineStages.slice(0, 6) : fallback.pipelineStages,
    workflowStates: data.workflowStates?.length ? data.workflowStates.slice(0, 6) : fallback.workflowStates,
    entityUpdates: data.entityUpdates?.length ? data.entityUpdates.slice(0, 8) : fallback.entityUpdates
  };
}

export async function runWorkflowAgent({
  intent,
  dataModel,
  mode
}: {
  intent: IntentOutput;
  dataModel: DataModelOutput;
  mode: RunMode;
}): Promise<AgentResult<WorkflowOutput>> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const fallback = buildFallbackWorkflow(mode);
  const system =
    "You are the Workflow Agent for Operon. Turn the business model into execution states, blockers, and next actions. Return valid JSON only.";
  const user = JSON.stringify({
    task: "Create pipeline stages, workflow states, and one blocker plus next action for every entity.",
    mode,
    intent,
    entities: dataModel.entities
  });

  try {
    const result = await callOpenAIJson<WorkflowOutput>({
      system,
      user,
      model,
      schema: { name: "workflow_agent_output", schema }
    });
    const data = normalizeWorkflow(result.data, fallback);
    return {
      model,
      data,
      trace: {
        agent: "Workflow Agent",
        input: `${intent.businessGoal} | ${mode}`,
        outputSummary: `Workflow Agent translated the model into pipeline stages, blockers, and next actions for ${data.entityUpdates.length} items.`,
        confidence: 0.82
      }
    };
  } catch {
    return {
      model,
      data: fallback,
      trace: {
        agent: "Workflow Agent",
        input: `${intent.businessGoal} | ${mode}`,
        outputSummary: "Workflow Agent used the fallback execution map to keep the operating workflow concrete.",
        confidence: 0.71
      }
    };
  }
}
