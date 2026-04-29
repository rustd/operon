import { runDecisionAgent } from "@/agents/decision";
import { runInterpreterAgent } from "@/agents/interpreter";
import { runOptimizerAgent } from "@/agents/optimizer";
import { runUiAgent } from "@/agents/ui";
import { baseRisks, getScenarioDeals } from "@/lib/demoData";
import type { BusinessOSResponse, Persona, SimulationMode } from "@/lib/types";

export async function runAgents({
  prompt,
  persona,
  simulationMode,
  feedback
}: {
  prompt: string;
  persona: Persona;
  simulationMode: SimulationMode;
  feedback?: string;
}): Promise<BusinessOSResponse> {
  const deals = getScenarioDeals(simulationMode);
  const risks = baseRisks;

  const interpreter = await runInterpreterAgent(prompt, feedback);
  const optimizer = await runOptimizerAgent(interpreter.data, feedback);
  const ui = await runUiAgent(optimizer.data, feedback);
  const decisions = await runDecisionAgent({
    optimizer: optimizer.data,
    deals,
    risks,
    simulationMode,
    feedback
  });
  const trace = [interpreter.trace, optimizer.trace, ui.trace, decisions.trace];

  return {
    prompt,
    feedback,
    persona,
    simulationMode,
    rewriteApplied: Boolean(feedback?.trim()),
    demoMode: trace.some((entry) => !entry.usedLiveLLM),
    modelPlan: {
      interpreter: interpreter.model,
      optimizer: optimizer.model,
      ui: ui.model,
      decision: decisions.model
    },
    availableModels: [interpreter.model, optimizer.model, ui.model, decisions.model],
    interpreter: interpreter.data,
    optimizer: optimizer.data,
    ui: ui.data,
    decisions: decisions.data,
    deals,
    risks,
    trace
  };
}
