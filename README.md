# Operon

Software that runs your business.

Operon turns business intent into a working operating system. You describe the outcome you want. Operon generates the workflow, business impact, top decisions, and persona-specific views that help run the company.

## What it does

Give Operon a prompt like:

> I run partnerships at a fintech startup. Maximize revenue from partner deals, reduce renewal risk, and tell me what to do today.

Operon then:

1. Interprets the business goal
2. Builds a business data model
3. Generates a workflow
4. Prioritizes decisions
5. Calculates business impact
6. Shapes the interface for Operator, CFO, and CPTO

This is not a dashboard. It is software that rewrites itself around the outcome.

## Demo flow

1. Enter a business prompt
2. Click `Run my business`
3. Review pipeline value, at-risk revenue, upside today, and top decisions
4. Switch between `Operator`, `CFO`, and `CPTO`
5. Click `What should I do today?`
6. Watch Operon rerank the work and update the expected upside

## Why it feels different

Most business software shows the same underlying data in slightly different views.

Operon starts with the decision. The interface is generated from the business goal, so the product changes when the goal changes.

- `Operator` sees execution, blockers, and next actions
- `CFO` sees revenue quality, exposure, and upside
- `CPTO` sees tradeoffs, resource allocation, and what to stop doing

## Architecture

Operon uses six separate agents plus one orchestrator.

```mermaid
flowchart LR
    A["Business Prompt"] --> B["Intent Agent"]
    B --> C["Data Model Agent"]
    C --> D["Workflow Agent"]
    D --> E["Decision Agent"]
    E --> F["Impact Agent"]
    F --> G["UI Agent"]
    G --> H["Generated Business System"]
```

### Agents

- `agents/intentAgent.ts`
  - extracts role, business goal, north-star metric, constraints, and assumptions
- `agents/dataModelAgent.ts`
  - generates business entities, stages, metrics, and relationships
- `agents/workflowAgent.ts`
  - maps entities into pipeline states, blockers, and next actions
- `agents/decisionAgent.ts`
  - prioritizes concrete business decisions with impact, owner, and urgency
- `agents/impactAgent.ts`
  - calculates pipeline value, at-risk revenue, upside today, and confidence
- `agents/uiAgent.ts`
  - shapes the persona-specific interface
- `agents/orchestrator.ts`
  - runs the full pipeline and returns one product-facing response

Each agent has:

- its own system prompt
- its own OpenAI call when `OPENAI_API_KEY` is set
- strict JSON output handling
- deterministic fallback behavior if live generation is unavailable

## API

Endpoint:

- `POST /api/run-business`

Request:

```json
{
  "prompt": "I run partnerships at a fintech startup. Maximize revenue from partner deals, reduce renewal risk, and tell me what to do today.",
  "persona": "operator",
  "mode": "generate",
  "currentState": null
}
```

Response:

```json
{
  "company": {
    "role": "Head of Partnerships",
    "businessGoal": "Maximize partner revenue while reducing renewal risk.",
    "northStarMetric": "Risk-adjusted partner revenue"
  },
  "impact": {
    "pipelineValue": 3140000,
    "atRiskRevenue": 810000,
    "upsideToday": 420000,
    "confidence": 0.78
  },
  "entities": [],
  "decisions": [],
  "personaView": {
    "title": "Operator view",
    "summary": "Optimized for revenue impact today.",
    "sections": []
  },
  "agentTrace": []
}
```

## Deterministic business logic

Operon does not rely on language generation alone.

- `expectedValue = value * probability`
- `atRiskRevenue = sum(value where risk = high)`
- `upsideToday = sum(expected value of today-priority decisions), capped realistically`

If `OPENAI_API_KEY` is missing, the app silently falls back to deterministic outputs so the product still works end-to-end.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- OpenAI Responses API

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If `3000` is busy, Next.js will use the next available port.

## Checks

```bash
npm run check
```

This runs:

- TypeScript typecheck
- production build verification

## Environment variables

Required for live OpenAI calls:

```bash
OPENAI_API_KEY=your_openai_api_key
```

Optional:

```bash
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

## Deploy to Vercel

1. Push the repo to GitHub
2. Import it into Vercel
3. Set:
   - `OPENAI_API_KEY`
   - optional `OPENAI_BASE_URL`
   - optional `OPENAI_MODEL`
4. Deploy

The app runs as a standard Next.js project with one API route, so deployment is straightforward.

## Repo guide

- `app/page.tsx`
  - product shell, prompt entry, persona switching
- `components/DynamicRenderer.tsx`
  - business impact, decisions, persona views, reasoning drawer
- `app/api/run-business/route.ts`
  - public API entry point
- `lib/openai.ts`
  - OpenAI structured output wrapper with retry
- `lib/demoData.ts`
  - deterministic sample data and fallback calculations
- `docs/demo-script.md`
  - 60-second YC demo script

## One-line pitch

Operon turns business intent into software that runs the company.
