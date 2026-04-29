# Operon

Operon is software that rewrites itself to run your business.

You give it business intent, not UI requirements. Operon interprets the goal, builds a business operating model, generates the interface that matches the outcome, and returns decisions instead of dashboards.

## What the demo shows

The core demo flow is built around one founder-readable story:

1. The user describes a business:
   - `I run partnerships at a fintech startup. Maximize revenue from partner deals, reduce renewal risk, and show me what to do today.`
2. Operon generates a working business system.
3. The user switches persona:
   - Operator
   - CFO
   - CPTO
4. The user gives feedback:
   - `Prioritize what I should do today to maximize revenue.`
5. Operon rewrites the system and simulates business impact.

The product is intentionally framed as:

- Not a dashboard
- Not a static admin template
- Not a developer console

It is a generated operating system for a business.

## Product flow

The app is designed as a guided YC demo:

- `Step 1`: Describe business
- `Step 2`: Generate system
- `Step 3`: Switch persona
- `Step 4`: Rewrite from feedback
- `Step 5`: Simulate impact

The top of the product always leads with business impact:

- Pipeline value
- At-risk revenue
- Expected upside today
- Decisions generated

The agent proof is still there, but it is moved into a collapsible section:

- `Why Operon made this decision`

## Agent architecture

Operon keeps the real multi-agent flow intact.

- `agents/interpreter.ts`
  - Translates the business prompt into structured business intent.
- `agents/optimizer.ts`
  - Re-ranks priorities, scoring logic, and decision pressure.
- `agents/ui.ts`
  - Produces persona-aware UI structure for Operator, CFO, and CPTO.
- `agents/decision.ts`
  - Generates executive decisions, business impact, and tradeoffs.

The orchestrator lives in `api/runAgents.ts` and sequences the loop. It does not replace the agents.

## How the agents work

Each agent makes its own independent OpenAI `responses` API call.

Flow:

1. `Interpreter` reads the business intent.
2. `Optimizer` converts intent into priorities and ranking logic.
3. `UI Generator` shapes the interface around the outcome.
4. `Decision Engine` generates the actions, tradeoffs, and impact.

If `OPENAI_API_KEY` is available, Operon uses live OpenAI calls.

If `OPENAI_API_KEY` is missing or a call fails, Operon falls back to deterministic demo logic and shows `Demo mode` in the product UI. This keeps the full demo flow working without breaking the experience.

## Project structure

```text
app/
  api/runAgents/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  DynamicRenderer.tsx
api/
  runAgents.ts
agents/
  interpreter.ts
  optimizer.ts
  ui.ts
  decision.ts
lib/
  demoData.ts
  openai.ts
  types.ts
```

## Run locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If port `3000` is busy, Next will move to the next available port.

## Environment variables

Required for live OpenAI calls:

```bash
OPENAI_API_KEY=your_openai_key
```

Optional:

```bash
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
OPENAI_INTERPRETER_MODEL=gpt-4.1-mini
OPENAI_OPTIMIZER_MODEL=gpt-4.1-mini
OPENAI_UI_MODEL=gpt-4.1-mini
OPENAI_DECISION_MODEL=gpt-4.1-mini
```

If no key is set, Operon runs in deterministic demo mode.

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Set the environment variables in the Vercel project:
   - `OPENAI_API_KEY`
   - optional `OPENAI_BASE_URL`
   - optional `OPENAI_MODEL`
   - optional per-agent model overrides
4. Deploy.

Because the app uses the Next.js App Router and a server route for agent orchestration, it works cleanly on Vercel without extra infrastructure.

## Acceptance checklist

The current demo is designed to satisfy these product expectations:

- `npm run dev` works
- The app loads as a polished product demo
- One-click generation works
- Persona switching changes the UI meaningfully
- Rewrite-from-feedback changes priorities and decisions
- Simulate impact shows before/after business value
- Agent trace is preserved but not dominant
- Demo mode works without live API access

## Operon in one line

Same data. Different decisions.
