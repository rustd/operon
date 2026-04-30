"use client";

import { expectedValue, formatCurrency } from "@/lib/demoData";
import type { BusinessSystemResponse, Persona, RunMode } from "@/lib/types";

function urgencyClasses(urgency: string): string {
  if (urgency === "today") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (urgency === "this_week") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-zinc-100 text-zinc-600";
}

function getPipelineColumns(data: BusinessSystemResponse) {
  return [
    {
      title: "High Value",
      items: data.entities.filter((entity) => entity.stage === "High Value")
    },
    {
      title: "Blocked",
      items: data.entities.filter((entity) => entity.stage === "Blocked")
    },
    {
      title: "At Risk",
      items: data.entities.filter((entity) => entity.stage === "At Risk")
    },
    {
      title: "Launching",
      items: data.entities.filter((entity) => entity.stage === "Launching")
    }
  ];
}

export default function DynamicRenderer({
  data,
  persona,
  mode
}: {
  data: BusinessSystemResponse;
  persona: Persona;
  mode: RunMode;
}) {
  const pipelineColumns = getPipelineColumns(data);
  const personaLabel = persona === "operator" ? "Operator" : persona === "cfo" ? "CFO" : "CPTO";
  const personaDecisionSummary =
    persona === "operator"
      ? "Execution, blockers, and the next moves that change revenue."
      : persona === "cfo"
        ? "Revenue quality, exposure, and the decisions that change the number."
        : "Tradeoffs, resource allocation, and what the team should stop doing.";

  return (
    <div className="flex max-w-full flex-col gap-5">
      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
            {personaLabel} view
          </span>
          <p className="min-w-0 break-words text-sm text-neutral-700">{personaDecisionSummary}</p>
        </div>
      </section>

      <section className="grid max-w-full gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-neutral-500">Pipeline</p>
          <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-neutral-950">
            {formatCurrency(data.impact.pipelineValue)}
          </p>
        </article>
        <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-neutral-500">At Risk</p>
          <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-neutral-950">
            {formatCurrency(data.impact.atRiskRevenue)}
          </p>
        </article>
        <article className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
          <p className="text-xs text-neutral-500">Upside Today</p>
          <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-neutral-950">
            +{formatCurrency(data.impact.upsideToday).replace("$", "")}
          </p>
        </article>
        <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-neutral-500">Confidence</p>
          <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-neutral-950">
            {Math.round(data.impact.confidence * 100)}%
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border border-neutral-950 border-l-4 border-l-black bg-neutral-950 p-6 text-white shadow-sm">
        <p className="text-xs text-neutral-500">Top decisions</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">What Operon would do next</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-300">
          {personaDecisionSummary}
        </p>

        <div className="mt-5 flex max-w-full flex-col gap-4">
          {data.decisions.map((decision, index) => (
            <article className="overflow-hidden rounded-xl border border-white/10 bg-white p-4 text-neutral-950 shadow-sm" key={decision.title}>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="rounded-full border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-500">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="min-w-0 break-words text-base font-semibold text-neutral-950">{decision.title}</h3>
                <span className={`rounded-full px-2 py-1 text-xs font-medium uppercase ${urgencyClasses(decision.urgency)}`}>
                  {decision.urgency === "this_week" ? "This week" : decision.urgency}
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="break-words text-base font-semibold text-neutral-950">{decision.impact}</p>
                <p className="break-words text-sm leading-6 text-neutral-700">{decision.why}</p>
                <p className="text-xs text-neutral-500">{decision.owner}</p>
              </div>
            </article>
          ))}
        </div>

        {mode === "today" ? (
          <p className="mt-4 text-sm font-medium text-emerald-300">
            Operon found +$420K expected upside by changing priorities.
          </p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-xs text-neutral-500">{data.personaView.title}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950">
          {persona === "operator"
            ? "The work moving the business"
            : persona === "cfo"
              ? "The revenue picture behind the system"
              : "The tradeoffs that shape execution"}
        </h2>
        <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-neutral-700">{data.personaView.summary}</p>

        {persona === "operator" ? (
          <div className="mt-4 max-w-full overflow-x-auto">
            <div className="flex min-w-0 gap-4">
              {pipelineColumns.map((column) => (
                <div
                  className="min-w-[220px] max-w-full overflow-hidden rounded-lg bg-neutral-50 p-3"
                  key={column.title}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{column.title}</p>
                  <div className="mt-3 flex flex-col gap-2">
                    {column.items.length ? (
                      column.items.map((entity) => (
                        <div
                          className="overflow-hidden rounded-lg border border-neutral-200 bg-white p-3"
                          key={entity.name}
                        >
                          <div className="flex min-w-0 items-center justify-between gap-3">
                            <p className="truncate text-sm font-medium text-neutral-950">{entity.name}</p>
                            <p className="shrink-0 text-sm text-neutral-500">{formatCurrency(entity.value)}</p>
                          </div>
                          <p className="mt-2 break-words text-sm leading-6 text-neutral-700">{entity.nextAction}</p>
                        </div>
                      ))
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-dashed border-neutral-200 bg-white p-3 text-sm text-neutral-500">
                        No items
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {persona === "cfo" ? (
          <div className="mt-4 max-w-full overflow-x-auto">
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <table className="min-w-full divide-y divide-neutral-200 text-left">
                <thead className="bg-neutral-50">
                  <tr className="text-xs text-neutral-500">
                    <th className="px-4 py-3 font-medium">Partner</th>
                    <th className="px-4 py-3 font-medium">Value</th>
                    <th className="px-4 py-3 font-medium">Expected Value</th>
                    <th className="px-4 py-3 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {data.entities.map((entity) => (
                    <tr key={entity.name}>
                      <td className="px-4 py-4 text-sm font-medium text-neutral-950">{entity.name}</td>
                      <td className="px-4 py-4 text-sm text-neutral-700">{formatCurrency(entity.value)}</td>
                      <td className="px-4 py-4 text-sm text-neutral-700">{formatCurrency(expectedValue(entity))}</td>
                      <td className="px-4 py-4 text-sm capitalize text-neutral-700">{entity.risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {persona === "cpto" ? (
          <div className="mt-4 grid max-w-full gap-4 md:grid-cols-3">
            {data.personaView.sections.map((section) => (
              <div className="overflow-hidden rounded-xl bg-neutral-50 p-4" key={section.title}>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{section.title}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {section.items.map((item) => (
                    <p className="break-words text-sm leading-6 text-neutral-700" key={item}>
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <details className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-medium text-neutral-900">Why Operon made this decision</summary>
        <div className="mt-4 grid max-w-full gap-4 lg:grid-cols-2">
          {data.agentTrace.map((trace) => (
            <article className="overflow-hidden rounded-lg bg-neutral-50 p-4" key={trace.agent}>
              <p className="text-sm font-medium text-neutral-950">{trace.agent}</p>
              <p className="mt-2 break-words text-sm leading-6 text-neutral-700">{trace.outputSummary}</p>
            </article>
          ))}
        </div>
      </details>
    </div>
  );
}
