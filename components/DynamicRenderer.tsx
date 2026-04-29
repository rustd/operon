"use client";

import type { BusinessOSResponse, Persona } from "@/lib/types";

const impactCards = [
  { label: "Pipeline", value: "$3.2M" },
  { label: "At Risk", value: "$810K" },
  { label: "Upside Today", value: "+$420K" }
];

const pipelineColumns = [
  { title: "High Value", items: ["Stripe — $900K", "Plaid — $650K"] },
  { title: "Blocked", items: ["Brex — launch blocked"] },
  { title: "At Risk", items: ["NovaPay — $390K"] },
  { title: "Launching", items: ["Stripe — rollout"] }
];

const topDecisions = [
  "Prioritize Stripe integration → +$900K expected value",
  "Fix Plaid contract clause → +$650K protected",
  "Escalate NovaPay renewal risk → $390K saved",
  "Stop low-value partner work → frees 2 eng weeks"
];

const operatorActions = [
  "Push Stripe integration to the top of the queue",
  "Fix Plaid commercial blocker today",
  "Escalate NovaPay risk owner"
];

const cfoStats = [
  { label: "Revenue Risk", value: "$810K" },
  { label: "Expected Upside", value: "+$420K" },
  { label: "Protected Value", value: "$650K" }
];

const cptoTradeoffs = [
  "Shift engineering time from low-value partner asks",
  "Focus on revenue-critical launches",
  "Escalate risk only where it protects material upside"
];

export default function DynamicRenderer({
  data,
  persona,
  showSimulation: _showSimulation
}: {
  data: BusinessOSResponse;
  persona: Persona;
  showSimulation: boolean;
}) {
  const rewriteApplied = data.rewriteApplied;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {impactCards.map((metric) => (
          <article className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm" key={metric.label}>
            <p className="text-sm font-medium text-zinc-500">{metric.label}</p>
            <p className="mt-4 text-5xl font-semibold tracking-[-0.08em] text-zinc-950">{metric.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.22em] text-zinc-400 uppercase">Generated system</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-zinc-950">
          {rewriteApplied ? "Optimized for revenue impact today." : "Business system generated from intent."}
        </h2>

        {persona === "operator" ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {pipelineColumns.map((column) => (
              <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-5" key={column.title}>
                <p className="text-sm font-semibold tracking-[0.16em] text-zinc-400 uppercase">{column.title}</p>
                <div className="mt-4 space-y-3">
                  {column.items.map((item) => (
                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800" key={item}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {persona === "cfo" ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {cfoStats.map((item) => (
              <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-5" key={item.label}>
                <p className="text-sm text-zinc-500">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-zinc-950">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {persona === "cpto" ? (
          <div className="mt-6 grid gap-4">
            {cptoTradeoffs.map((item) => (
              <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-800" key={item}>
                {item}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-[32px] border border-zinc-950 bg-zinc-950 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.22em] text-zinc-400 uppercase">Top decisions</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">What Operon would do next</h2>

        {persona === "operator" ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              {operatorActions.map((item) => (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium" key={item}>
                  {item}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {topDecisions.map((decision) => (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium" key={decision}>
                  {decision}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {topDecisions.map((decision) => (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium" key={decision}>
                {decision}
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-sm font-medium text-emerald-300">
          Operon found +$420K expected upside by changing priorities.
        </p>
      </section>

      <details className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Why Operon made this decision</summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {data.trace.map((trace) => (
            <article className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4" key={trace.agent}>
              <p className="text-sm font-semibold capitalize text-zinc-950">
                {trace.agent === "ui" ? "UI Generator" : trace.agent}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{trace.promptSummary}</p>
            </article>
          ))}
        </div>
      </details>
    </div>
  );
}
