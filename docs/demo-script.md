# CarbonTrace Lite — 4-Minute Demo Video Script

> Follows the submission strategy in [`updated plan.md`](./updated%20plan.md).
> All commands run with **zero API keys** (`USE_MOCK_DATA=true`, simulated
> attestation), so the demo is reproducible on any machine with Node ≥ 23.4.

## Setup (before recording)

```bash
npm install
npm test            # 23/23 passing — show briefly as credibility
npm run dev         # http://localhost:3000 — keep open in a tab
```

Have these ready in terminal tabs:
1. `npm run verify -- --type tree-planted --lat -26.2 --lon 28.05 --qty 40 --unit trees`
2. `npm run submit -- --type tree-planted --lat -26.2 --lon 28.05 --qty 40 --unit trees --agent school@alpha`

## Script

### 0:00–0:30 — Problem (talking head / title cards)

> "Community environmental work is invisible and unrewarded. Carbon markets
> only serve corporations — a school that plants 40 trees has no way to prove
> it, and no way to earn from it. Most green apps just trust whatever number
> you type in. CarbonTrace Lite doesn't trust — it **verifies**."

Show: dashboard at `http://localhost:3000` (map + stats).

### 0:30–1:30 — Live demo: submit a claim (screen share)

1. Fill the **Submit Claim** form: tree-planted, 40 trees, school@alpha.
2. Show the inline verification result: confidence, status, credits.
3. Open the claim certificate (`/claims/<id>`): point at **data hash**,
   **tx hash**, **sources**, then print/export the certificate.

Voice-over: "Every claim is cross-checked against independent satellite and
weather data before a single credit is issued."

### 1:30–2:30 — The verification engine (diagram / code walkthrough)

Explain the pipeline (`src/verification/engine.ts`):

1. **Validate** — Zod schema rejects bad input.
2. **Fetch** — NDVI + NDWI series + weather (mock by default, Sentinel Hub +
   OpenWeather live when keys are set).
3. **Features** — 7-dimension vector (`features.ts`).
4. **Score twice** — rule-based confidence (`scoring.ts`) **and** the ML
   anomaly detector (MLP in `ann.ts`, isolation forest alternative).
5. **Emit** — confidence → status → multiplier → credits
   (≥0.70 verified ×1.0 · 0.40–0.70 partial ×0.5 · <0.40 flagged ×0).

Demo a rejection: submit an absurd quantity (e.g. `--qty 100000`) and show
the flagged verdict + anomaly score. "Flat satellite signal, impossible
quantity — the ML model catches what rules alone would miss."

### 2:30–3:15 — On-chain proof (terminal + certificate)

Run the CLI submit command; point at the attestation block:

- `Data hash` — canonical SHA-256 of the verification result
  (`src/onchain/hash.ts`), reproducible offline via `hashVerification()`.
- `Tx hash` — simulated by default; with `POLYGON_RPC_URL` + `PRIVATE_KEY` +
  `CONTRACT_ADDRESS` set, `attestResult` submits a real
  `CarbonTraceCredits.mint()` on Polygon Amoy (`npm run deploy` checks
  readiness, `npm run compile` builds the artifact).
- Contract: `contracts/CarbonTraceCredits.sol` — `mint` + `verifyHash` let
  anyone confirm a claim hash on-chain.

### 3:15–4:00 — Community impact (back to the UI)

- **Map**: status-coloured markers of verified community actions.
- **Team dashboard** (`/agents/school@alpha`): balance, stats split, history.
- **Marketplace** (`/marketplace`): credits redeemed for local rewards.
- Close: "Trust layer for community climate action — today schools and
  farmers, tomorrow sensor nodes feeding the same pipeline. That's
  CarbonTrace Lite."

## Recording checklist

- [ ] 1080p, UI font scaled to ≥150% so the map/form are readable.
- [ ] Terminal font large; run each command once before recording (warm cache).
- [ ] Show `npm test` green (even 3 seconds builds credibility).
- [ ] End card: repo URL, contract address (or "simulated attestation" label),
      and the certificate export.
