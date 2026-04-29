"use client";

import DynamicRenderer from "@/components/DynamicRenderer";
import type { BusinessOSResponse, Persona, SimulationMode } from "@/lib/types";
import clsx from "clsx";
import { startTransition, useEffect, useMemo, useState } from "react";

const defaultPrompt = "I run partnerships at a fintech startup. Maximize revenue.";
const defaultFeedback = "Prioritize what I should do today to maximize revenue.";
const loadingStages = ["Understanding business...", "Optimizing for revenue...", "Generating system..."] as const;

async function fetchBusinessOS({
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
  const response = await fetch("/api/runAgents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt, persona, simulationMode, feedback })
  });

  if (!response.ok) {
    throw new Error("Unable to run agent pipeline");
  }

  return (await response.json()) as BusinessOSResponse;
}

export default function HomePage() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [feedback, setFeedback] = useState(defaultFeedback);
  const [persona, setPersona] = useState<Persona>("operator");
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("baseline");
  const [data, setData] = useState<BusinessOSResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);

  const run = async ({
    nextPrompt = prompt,
    nextPersona = persona,
    nextSimulation = simulationMode,
    nextFeedback
  }: {
    nextPrompt?: string;
    nextPersona?: Persona;
    nextSimulation?: SimulationMode;
    nextFeedback?: string;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchBusinessOS({
        prompt: nextPrompt,
        persona: nextPersona,
        simulationMode: nextSimulation,
        feedback: nextFeedback
      });
      setData(result);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const personaCards = useMemo(
    () => [
      {
        id: "operator" as const,
        title: "Operator",
        subtitle: "Execution pipeline, next actions, launch blockers"
      },
      {
        id: "cfo" as const,
        title: "CFO",
        subtitle: "Revenue forecast, risk exposure, expected value"
      },
      {
        id: "cpto" as const,
        title: "CPTO",
        subtitle: "Executive decisions, tradeoffs, resource allocation"
      }
    ],
    []
  );

  useEffect(() => {
    if (!loading) {
      setLoadingStageIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingStageIndex((current) => (current + 1) % loadingStages.length);
    }, 650);

    return () => window.clearInterval(interval);
  }, [loading]);

  const handleGenerate = () => {
    setSimulationMode("baseline");
    startTransition(() => {
      void run({ nextPrompt: prompt, nextSimulation: "baseline", nextFeedback: undefined });
    });
  };

  const handlePersonaSwitch = (nextPersona: Persona) => {
    setPersona(nextPersona);
  };

  const handleToday = () => {
    startTransition(() => {
      void run({ nextPrompt: prompt, nextSimulation: "baseline", nextFeedback: feedback });
    });
  };

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-white/10 bg-zinc-950 px-6 py-8 text-white shadow-[0_40px_120px_rgba(0,0,0,0.35)] sm:px-10">
          <p className="text-sm font-medium tracking-[0.28em] text-emerald-300/80 uppercase">Operon</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">Software that runs your business</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg">
            Describe your business. Operon generates a working system with top decisions and business impact.
          </p>
        </div>

        <section className="-mt-8 rounded-[36px] border border-zinc-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.1)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-sm font-semibold tracking-[0.22em] text-zinc-400 uppercase">Business intent</p>
                <textarea
                  className="mt-4 min-h-40 w-full rounded-[24px] border border-zinc-200 bg-white px-5 py-4 text-base leading-7 text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  rows={5}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.01]"
                    onClick={handleGenerate}
                    type="button"
                  >
                    Run my business
                  </button>
                  <button
                    className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:border-zinc-950"
                    disabled={loading}
                    onClick={handleToday}
                    type="button"
                  >
                    What should I do today?
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-zinc-200 bg-white p-5">
                <p className="text-sm font-semibold tracking-[0.22em] text-zinc-400 uppercase">View</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {personaCards.map((card) => (
                    <button
                      className={clsx(
                        "rounded-[22px] border px-4 py-4 text-left transition",
                        persona === card.id
                          ? "border-zinc-950 bg-zinc-950 text-white"
                          : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-white"
                      )}
                      key={card.id}
                      onClick={() => handlePersonaSwitch(card.id)}
                      type="button"
                    >
                      <p className="text-base font-semibold">{card.title}</p>
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold tracking-[0.22em] text-zinc-400 uppercase">Operon</p>
                  <p className="mt-3 text-lg font-semibold text-zinc-950">{loadingStages[loadingStageIndex]}</p>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div>
              {data ? (
                <DynamicRenderer data={data} persona={persona} showSimulation={false} />
              ) : (
                <div className="rounded-[32px] border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
                  <h3 className="text-3xl font-semibold tracking-[-0.05em] text-zinc-950">Run my business</h3>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-600">
                    Operon will generate the business system, show the impact, and surface the decisions that matter.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
