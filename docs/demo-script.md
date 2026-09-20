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

## Presenter explainer — carbon markets + CTC credits in plain language

Read this if you are not technical. Say it in your own words on camera.

**What is a carbon market? Think of it like a reward market for cleaning the air.**
When someone removes pollution, they earn a "credit." Big companies buy those
credits to cancel out their own pollution. The problem: only big companies can
play. To earn normal credits you must hire expensive experts to prove what you
did. A school that plants 40 trees cannot afford that, so it gets nothing.

**What is CTC? Think of it like loyalty points or airtime for green work.**
CTC means CarbonTrace Credits. You do something good for nature, you earn points.

- Plant 1 tree = 2 points.
- So 40 trees = 80 points.

Other actions earn points too: composting, recycling, saving electricity,
restoring wetlands.

**How do you earn the points? We check first, then we pay.**
Like a teacher marking homework — we don't just believe you, we check proof:

- Fully proven = full points (80 points for 40 trees).
- Half proven = half points (40 points).
- Not believable = 0 points, flagged for review.

How do we check? We look at satellite pictures and weather for that place and
time. Green growing where you planted? Weather makes sense? Then it passes.

**What can you do with CTC points? Swap them for real things nearby.**
Not cash. Think shop tokens: seedlings, compost bins, tools, market discounts
in the Marketplace page. Do good → earn points → get rewards.

**Why should anyone trust it? Every point comes with a receipt that cannot be changed.**
Each reward gets a certificate with its own fingerprint stored safely online
(blockchain). Anyone can look it up later and see: who, what, where, and how
we checked it.

## Script

### 0:00–0:30 — Problem (talking head / title cards)

> "Community environmental work is invisible and unrewarded. Carbon markets
> only serve corporations — a school that plants 40 trees has no way to prove
> it, and no way to earn from it. Most green apps just trust whatever number
> you type in. CarbonTrace Lite doesn't trust — it **verifies**."

Say on camera (simple version): "Normal carbon markets pay big companies for
cleaning the air, but a school planting trees gets nothing because proof is
too expensive. So we created CTC — like airtime points for green work: plant
trees, we check from satellite, you earn points you can swap for seedlings
and tools."

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
  Voice-over: "Think of CTC like shop tokens, not cash. Do something green,
  earn points, swap them for seedlings, compost bins, or tool vouchers."
- Close: "Trust layer for community climate action — today schools and
  farmers, tomorrow sensor nodes feeding the same pipeline. That's
  CarbonTrace Lite."

## Recording checklist

- [ ] 1080p, UI font scaled to ≥150% so the map/form are readable.
- [ ] Terminal font large; run each command once before recording (warm cache).
- [ ] Show `npm test` green (even 3 seconds builds credibility).
- [ ] End card: repo URL, contract address (or "simulated attestation" label),
      and the certificate export.
