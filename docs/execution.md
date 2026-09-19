# CarbonTrace Lite — Execution Plan & Status Audit

> **Goal**: verifiable community carbon ledger — cross-check community-reported
> environmental actions against independent satellite + weather data, score them
> with a rule-based engine + ML anomaly detector, and attest the outcome
> on-chain as carbon credits.
>
> This document maps the 6-day plan (see [`updated plan.md`](./updated%20plan.md))
> to the actual state of the codebase, flags what is complete, and lists what is
> missing with concrete next steps.

**Audit date**: 2026-09-18 (updated after second implementation pass)
**Verified state**: `npm test` → 23/23 passing · `npm run typecheck` → clean · `npm run build` → not re-verified this pass (Next build exceeded the audit timeout; last known succeeding)

---

## 1. Status Overview

| Day | Planned deliverable | Status |
|---|---|---|
| Day 1 | Data model + verification engine skeleton + satellite API integration | ✅ Complete |
| Day 2 | ML anomaly-detection model (synthetic data) | ✅ Complete (synthetic only — no public datasets) |
| Day 3 | Backend + database + API (full claim → score pipeline) | ✅ Complete |
| Day 4 | Smart contract + on-chain attestation | ✅ Complete (simulated default; live path unified & deployable with keys) |
| Day 5 | Frontend: map, dashboard, marketplace, certificate export | ✅ Complete |
| Day 6 | Demo video + README + submission package | 🟡 `README.md` + line-by-line `docs/demo-script.md` written; recording the video + Devpost submission still outstanding |

**Overall**: the full product — verification backend **and** application layer —
is implemented, tested, and demoable. Remaining items are packaging/deployment
artefacts that require external resources (tesnet keys, a recorded video).

---

## 2. What Was Completed in This Implementation Pass

### 2.1 Application layer (`app/`)
| Feature | Location |
|---|---|
| Dashboard with live stats, community map, claim feed, submit form, flagged-review queue | `app/page.tsx` + `app/components/Dashboard.tsx` |
| Interactive Leaflet community map (CARTO dark basemap, OSM data, status-coloured circle markers + certificate popups, client-only via `next/dynamic`) | `app/components/CommunityMap.tsx` + `app/components/CommunityMapInner.tsx` |
| Claim submission form → `/api/verify` with inline result | `app/components/SubmitClaim.tsx` |
| Claim detail page + **printable certificate** with data hash / tx hash / sources | `app/claims/[id]/page.tsx`, `app/components/CertificateActions.tsx` |
| Team/agent dashboard (balance, stats split, history) | `app/agents/[agentRef]/page.tsx` |
| Points **marketplace** with rewards catalogue + local redemption ledger | `app/marketplace/page.tsx` |
| Site navigation + dark theme | `app/layout.tsx`, `app/components/Nav.tsx`, `app/globals.css` |
| Shared client API types/helpers | `src/lib/api.ts` |

### 2.2 Fixes made during the pass
- `/api/verify` now honours envelope-level `agentRef`/`note` and binds the
  resolved owner id into the attested claim (`app/api/verify/route.ts`).
- Agent ids normalised through `src/lib/agent.ts` (`normalizeAgentId`); the
  users API + agents page accept both canonical and friendly refs.
- On-chain attestation unified: `attestResult` now drives the active ledger
  client (simulated offline / real Polygon `mint` when keys are set)
  (`src/onchain/attestation.ts`); `COMMUNITY_ADDRESS` added to `.env.example`.
- Live-chain switch unified (second pass): `liveChainConfigured()` in
  `src/chain/index.ts` is the single source of truth shared by
  `buildLedgerClient()` and `attestationMode()` — live when
  `POLYGON_RPC_URL` + `PRIVATE_KEY` + `CONTRACT_ADDRESS` are set, unless
  `USE_LIVE_CHAIN=false` forces offline. Previously the two functions used
  different predicates and could disagree. `USE_LIVE_CHAIN` documented in
  `.env.example`.
- `submitClaim` (`src/services/claim-service.ts`) canonicalised onto the
  `Repository` abstraction (`getRepository()`): normalises the owner id,
  binds it into the verified claim like `/api/verify` does, attests via
  `attestResult`, persists + awards credits through the repo. Legacy sync
  `getClaim`/`listClaims`/`getUserDashboard` remain as deprecated
  read-compat exports over the same SQLite file.
- `GET /api/claims/[id]` now reads via `getRepository()` (async), like the
  list route, instead of the legacy sync helper. Returns `result` (plus a
  `claim` alias for the previous shape).
- Removed stale duplicate `src/onchain/contracts/CarbonTraceCredits.sol`, dead
  `data/models/anomaly-forest.json`, redundant `/api/users/[id]` route, and
  the duplicate `deploy` key in `package.json` (the earlier audit claimed
  this was removed, but the duplicate was still present — removed in the
  second pass).
- `.gitignore` no longer excludes `data/models/*.json`: the trained
  `data/models/anomaly-model.json` is intentionally tracked so a fresh clone
  works without retraining.
- `README.md` (submission package) written; `docs/demo-script.md` added with
  the line-by-line 4-minute video script.

---

## 3. What Is Complete (audit)

### 2.1 Core domain & data model — `src/types/claim.ts`
- 5 claim types, Zod `claimSchema` validation, base credits per unit, typical
  quantity caps, full `VerificationResult` / `Credit` / `User` types. ✅

### 2.2 Verification engine — `src/verification/`
| File | What it does |
|---|---|
| `engine.ts` | Orchestrates the pipeline: validate → fetch signals → feature build → score → emit result. Returns `claimId`, `confidence`, `status`, `multiplier`, `creditsAwarded`, per-signal breakdown, anomaly score. |
| `features.ts` | 7-feature vector (`ndviDelta`, `ndviLevel`, `ndwiDelta`, `tempNormDiff`, `precipNorm`, `seasonFit`, `quantityPlausibility`) in [0,1] for the ML models. |
| `scoring.ts` | Rule-based confidence: per-claim-type primary signal (NDVI / NDWI / weather) + shared quantity + season signals with human-readable reasons. |
| `multipliers.ts` | Thresholds: ≥0.70 verified (×1.0), 0.40–0.70 partial (×0.5), <0.40 flagged (×0). |
| `ann.ts` | Dependency-free MLP (7 → N → 1) with Adam training + inference. |
| `isolation-forest.ts` | Dependency-free isolation forest for anomaly scoring (deterministic scoring). |
| `synthetic-data.ts` | Labeled fraud-pattern generator (flat signals, over-claims, out-of-season, combined fraud). |

- Trained artifact present: `data/models/anomaly-model.json` (loaded by the
  engine, `engine.ts:34`).
- Training script: `scripts/train-model.ts` (`npm run train`).

### 2.3 Data sources — `src/data-sources/`
- `mock.ts`: deterministic, key-free seeded provider (default — `USE_MOCK_DATA=true`).
- `sentinel-hub.ts`: live Sentinel Hub **Statistical API** client for NDVI/NDWI.
- `openweather.ts`: live OpenWeather current + forecast → `SignalWeather`.
- `index.ts`: composite fetcher, falls back per-source when keys are absent.

### 2.4 Storage — `src/storage/` + `src/db/`
- `storage/types.ts`: small `Repository` interface (claims / users / credits / stats).
- `json-file.ts`: atomic JSON-file repo (zero-config).
- `sqlite-repository.ts`: SQLite repo on Node's built-in `node:sqlite` (no native deps), idempotent schema extension (`credits` table, balances).
- `db/database.ts`: SQLite schema + migrations.
- `db/repository.ts`: SQL helpers (`saveClaim`, `listClaims`, `saveAttestation`, `getUserDashboard`).

### 2.5 On-chain / chain — `src/chain/`, `src/onchain/`, `contracts/`
- `chain/types.ts`: `LedgerClient` interface + canonical keccak claim hash.
- `chain/simulated.ts`: offline deterministic attestation (default).
- `chain/evm.ts`: live Polygon Amoy client (ethers) — `mint` + `verifyHash`.
- `chain/index.ts`: env switch (`USE_LIVE_CHAIN`, `POLYGON_RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`).
- `onchain/hash.ts`: canonical SHA-256 `hashVerification` + `fingerprint`.
- `onchain/attestation.ts`: simulated/live attestation snapshot.
- `onchain/rpc.ts`: read-only JSON-RPC connectivity/chain-id/contract-code checks.
- `contracts/CarbonTraceCredits.sol`: full ERC-20 + `mint`/`verifyHash` attestation; compiled artifact at `contracts/out/CarbonTraceCredits.json`.

### 2.6 Service + API — `src/services/`, `app/api/`
- `claim-service.ts`: `submitClaim` = verify → persist → attest full pipeline.
- `POST /api/verify` (`app/api/verify/route.ts`): verify, attest, persist, award credits, return stats. Also `GET` usage info.
- `GET /api/claims`, `GET /api/claims/[id]`, `GET /api/users/[agentRef]` (canonical + friendly refs via `src/lib/agent.ts`).

### 2.7 Tooling / scripts
- `scripts/compile-contract.ts`, `deploy-contract.ts`, `train-model.ts`, `verify-cli.ts`, `submit-claim.ts`.
- `vitest.config.ts` / `tests/` — **23 tests passing** (schema, multipliers, engine determinism, isolation forest, MLP accuracy, hashing, attestation, JSON repo, credits & stats).

---

## 4. What Is Still Missing (after implementation pass)

### 4.1 Live chain deployment (Day 4 follow-up) — **needs credentials**
- The live attestation path is now fully wired: with
  `PRIVATE_KEY` + `CONTRACT_ADDRESS` + `POLYGON_RPC_URL` set, `attestResult`
  submits a real `CarbonTraceCredits.mint()` transaction
  (`src/onchain/attestation.ts`). Nothing is **actually deployed** because no
  testnet keys/address are configured — deploy via
  `npm run compile && npm run deploy`, then set `CONTRACT_ADDRESS` to make the
  claim hash queryable on Polygon Amoy.

### 4.2 Demo video + Devpost submission (Day 6 remainder)
- `README.md` covers methodology, integrations, ML architecture, contract,
  and deployment; `docs/demo-script.md` has the line-by-line 4-minute script.
  Still outstanding: recording the video and the Devpost entry itself.

### 4.3 Model training data
- Anomaly detector trained on **synthetic** data only. Public datasets (soil
  carbon, land-cover surveys) remain a roadmap item (noted in README).

### 4.4 Residual debt (definitely non-blocking)
- `src/db/repository.ts` sync helpers remain as deprecated read-compat exports
  (same SQLite file, so no data divergence); new code uses the `Repository`
  interface. A future pass can remove them once all consumers are async.
- Git hygiene: the implementation is still uncommitted (single "Initial commit"
  containing only `LICENSE`).

---

## 5. Recommended Next Steps (priority order)

1. **Live deployment**: compile + deploy the contract, set `CONTRACT_ADDRESS`
   (and optionally `COMMUNITY_ADDRESS`), restart, verify a claim hash on
   Polygon Amoy. `npm run deploy` reports readiness; `USE_LIVE_CHAIN=false`
   forces offline mode even with keys set.
2. **Demo video** following the line-by-line script in `docs/demo-script.md`
   (based on `docs/updated plan.md`), using the working UI at `npm run dev`.
3. **Commit** the codebase (the implementation is currently untracked; note
   `data/models/anomaly-model.json` is now intentionally tracked — use
   `git add -f` if your gitignore predates the fix).
4. Optional polish: train on public data.

---

## 6. How to Verify This Project

| Command | Purpose |
|---|---|
| `npm install` | Install deps (Node ≥ 23.4 recommended for `node:sqlite`) |
| `npm test` | Run vitest suite (23 tests) |
| `npm run typecheck` | TypeScript check |
| `npm run verify -- --type tree-planted --lat -26.2 --lon 28.05 --qty 40 --unit trees` | CLI verification demo |
| `npm run submit -- ... --agent school@alpha` | Full submit → store → attest pipeline |
| `npm run train` | Retrain anomaly-detection MLP |
| `npm run compile && npm run deploy` | Compile + guided live-chain deployment check |
| `npm run dev` | Start Next.js (API + frontend) |