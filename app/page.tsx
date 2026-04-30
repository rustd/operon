"use client";

import DynamicRenderer from "@/components/DynamicRenderer";
import type { BusinessSystemResponse, Persona, RunMode } from "@/lib/types";
import clsx from "clsx";
import { startTransition, useEffect, useMemo, useState } from "react";

const defaultPrompt =
  "I run partnerships at a fintech startup. Maximize revenue from partner deals, reduce renewal risk, and tell me what to do today.";
const loadingStages = [
  "Understanding business goal...",
  "Ranking revenue impact...",
  "Rebuilding workflow...",
  "Generating decisions..."
] as const;

async function fetchBusinessSystem({
  prompt,
  persona,
  mode,
  currentState
}: {
  prompt: string;
  persona: Persona;
  mode: RunMode;
  currentState?: BusinessSystemResponse | null;
}): Promise<BusinessSystemResponse> {
  const response = await fetch("/api/run-business", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt, persona, mode, currentState })
  });

  if (!response.ok) {
    throw new Error("Unable to run Operon");
  }

  return (await response.json()) as BusinessSystemResponse;
}

export default function HomePage() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [persona, setPersona] = useState<Persona>("operator");
  const [data, setData] = useState<BusinessSystemResponse | null>(null);
  const [mode, setMode] = useState<RunMode>("generate");
  const [loading, setLoading] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const personas = useMemo(
    () => [
      { id: "operator" as const, title: "Operator" },
      { id: "cfo" as const, title: "CFO" },
      { id: "cpto" as const, title: "CPTO" }
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
    }, 700);

    return () => window.clearInterval(interval);
  }, [loading]);

  const run = async ({
    nextMode,
    nextPersona = persona
  }: {
    nextMode: RunMode;
    nextPersona?: Persona;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchBusinessSystem({
        prompt,
        persona: nextPersona,
        mode: nextMode,
        currentState: data
      });
      setData(result);
      setMode(nextMode);
      setPersona(nextPersona);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    startTransition(() => {
      void run({ nextMode: "generate" });
    });
  };

  const handleToday = () => {
    startTransition(() => {
      void run({ nextMode: "today" });
    });
  };

  const handlePersonaChange = (nextPersona: Persona) => {
    if (!data) {
      setPersona(nextPersona);
      return;
    }

    setPersona(nextPersona);

    startTransition(() => {
      void run({ nextMode: mode, nextPersona });
    });
  };

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-5">
        <header className="max-w-full">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">Operon</h1>
          <p className="mt-1 text-sm text-neutral-500">Software that runs your business</p>
        </header>

        <section className="flex max-w-full flex-col gap-5 lg:flex-row lg:items-start">
          <aside className="w-full max-w-full lg:w-[360px] lg:flex-none lg:sticky lg:top-6">
            <div className="flex flex-col gap-5">
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Business intent</p>
                <textarea
                  className="mt-3 w-full max-w-full rounded-lg border border-neutral-200 p-3 text-sm leading-6 text-neutral-900 outline-none transition focus:border-neutral-400"
                  rows={7}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                    onClick={handleGenerate}
                    type="button"
                  >
                    Run my business
                  </button>
                  <button
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-50"
                    disabled={loading || !data}
                    onClick={handleToday}
                    type="button"
                  >
                    What should I do today?
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Perspective</p>
                <div className="mt-3 flex max-w-full flex-wrap gap-2">
                  {personas.map((item) => (
                    <button
                      className={clsx(
                        "rounded-full border px-3 py-1 text-sm font-medium transition",
                        persona === item.id
                          ? "border-black bg-black text-white"
                          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                      )}
                      key={item.id}
                      onClick={() => handlePersonaChange(item.id)}
                      type="button"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Operon</p>
                  <p className="mt-2 text-sm font-medium text-neutral-900">{loadingStages[loadingStageIndex]}</p>
                </div>
              ) : null}

              {data && mode === "today" ? (
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Today</p>
                  <p className="mt-2 text-sm font-medium text-neutral-900">
                    Operon found +$420K expected upside by changing priorities.
                  </p>
                </div>
              ) : null}

              {error ? (
                <div className="overflow-hidden rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
                  {error}
                </div>
              ) : null}
            </div>
          </aside>

          <section className="min-w-0 max-w-full flex-1">
            {data ? (
              <DynamicRenderer data={data} persona={persona} mode={mode} />
            ) : (
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-neutral-950">Business intent in. Operating system out.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-700">
                  Operon generates business impact, a live workflow, and the decisions that matter for Operator, CFO,
                  and CPTO.
                </p>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
