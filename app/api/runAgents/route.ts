import { runAgents } from "@/api/runAgents";
import type { Persona, SimulationMode } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      persona?: Persona;
      simulationMode?: SimulationMode;
      feedback?: string;
    };

    const prompt = body.prompt?.trim() || "I run partnerships at a fintech startup";
    const persona = body.persona ?? "operator";
    const simulationMode = body.simulationMode ?? "baseline";
    const feedback = body.feedback?.trim();

    const response = await runAgents({ prompt, persona, simulationMode, feedback });
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
