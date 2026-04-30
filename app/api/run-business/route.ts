import { runBusinessSystem } from "@/agents/orchestrator";
import type { Persona, RunBusinessRequest, RunMode } from "@/lib/types";
import { NextResponse } from "next/server";

function isPersona(value: string | undefined): value is Persona {
  return value === "operator" || value === "cfo" || value === "cpto";
}

function isMode(value: string | undefined): value is RunMode {
  return value === "generate" || value === "today" || value === "rewrite";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RunBusinessRequest>;
    const prompt =
      body.prompt?.trim() ||
      "I run partnerships at a fintech startup. Maximize revenue from partner deals, reduce renewal risk, and tell me what to do today.";
    const persona = isPersona(body.persona) ? body.persona : "operator";
    const mode = isMode(body.mode) ? body.mode : "generate";

    const response = await runBusinessSystem({
      prompt,
      persona,
      mode,
      currentState: body.currentState ?? null
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
