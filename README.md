# CarbonTrace Lite

**A verifiable community carbon ledger.**

Communities, schools and small farmers log environmental actions (tree planting,
composting, recycling, energy savings, wetland restoration). CarbonTrace Lite
**does not trust self-reported numbers** — it cross-checks every claim against
independent satellite and weather data, scores it with a rule-based engine plus
an ML anomaly detector, and attests the outcome on a blockchain as immutably
verifiable carbon credits (CTC).

> No hardware required. Runs fully offline with mock data (zero API keys), and
> upgrades to live Sentinel Hub + OpenWeather + Polygon Amoy when keys are set.

---

## Why it matters

Most "green apps" only estimate carbon — they produce numbers nobody can
verify. Carbon markets serve corporations; communities are locked out.
CarbonTrace Lite is a **trust layer**: each claim becomes a reproducible
verification verdict (confidence score, per-signal breakdown, credit amount)
plus an on-chain attestation you can verify yourself.

## The verification methodology

| Claim type | Primary source | Cross-check |
|---|---|---|
| Tree planted | Satellite NDVI series at the location | Green-up must be consistent with the claimed action |
| Wetland restoration | Satellite NDWI series | Surface-water increase must be visible |
| Composting | Weather (temp, moisture) | Decomposition plausibility window |
| Energy saved | Weather vs seasonal norm | Savings consistent with the weather baseline |
| Recycling | — (no independent source) | Quantity + seasonal plausibility only; never full credits |

**How a claim is scored** (`src/verification/engine.ts`):

1. **Validate** — Zod schema (`src/types/claim.ts`).
2. **Fetch** independent signals: NDVI + NDWI series and weather from the active
   data-fetcher (`src/data-sources/`).
3. **Build features** — a fixed 7-dimension vector in [0,1] (`ndviDelta`,
   `ndviLevel`, `ndwiDelta`, `tempNormDiff`, `precipNorm`, `seasonFit`,
   `quantityPlausibility`).
4. **Score (two independent models)**:
   - Rule-based confidence with a per-signal breakdown (`scoring.ts`).
   - ML anomaly score from a trained neural network (or isolation forest).
5. **Emit** confidence → status → multiplier → credits:

   | Confidence | Status | Credits |
   |---|---|---|
   | ≥ 0.70 | verified | full (×1.0) |
   | 0.40–0.70 | partial | half (×0.5) |
   | < 0.40 | flagged | none (community review) |

Every result includes a human-readable `signalsBreakdown` — why each source
supports or contradicts the claim — and an `anomalyScore` from the ML model.

## ML anomaly detection

- `src/verification/ann.ts` — dependency-free MLP (7 → N → 1), trained offline
  with Adam, persisted to `data/models/anomaly-model.json`. Runtime is a single
  forward pass (serverless-friendly).
- `src/verification/isolation-forest.ts` — dependency-free isolation forest,
  an alternative detector.
- `src/verification/synthetic-data.ts` — a labeled generator that encodes *how
  fraud looks* in feature space: flat satellite signals, impossible quantities,
  out-of-season actions, combined fraud. Trained accuracy >90% on this set
  (`tests/engine.test.ts`).
- Retrain with `npm run train` (env: `TRAIN_SEED`, `HIDDEN`, `EPOCHS`).

> Note: the detector is trained on synthetic data. For a real deployment you
> would additionally train on public datasets (e.g. soil carbon / land-cover
> survey data) as described in the roadmap.

## API integrations

| Provider | Purpose | Env vars |
|---|---|---|
| Sentinel Hub (Statistical API) | Live NDVI / NDWI series | `SH_CLIENT_ID`, `SH_CLIENT_SECRET` |
| OpenWeather | Current + forecast → seasonal norm | `OPENWEATHER_API_KEY` |
| Mock (default) | Deterministic offline demo, no keys | `USE_MOCK_DATA=true` |
| Polygon Amoy + ethers | On-chain attestation + CTC mint | `PRIVATE_KEY`, `POLYGON_RPC_URL`, `CONTRACT_ADDRESS` |

## Smart contract

`contracts/CarbonTraceCredits.sol` — a minimal, dependency-free ERC-20:

- `mint(community, claimHash, confidencePercent, amount)` — only the minter
  (backend) can attest a claim hash and mint credits to the community account.
- `verifyHash(claimHash)` — returns the on-chain attestation (nonce,
  confidence %, timestamp). **This is how any claim can be verified publicly.**
- Compile: `npm run compile` → `contracts/out/CarbonTraceCredits.json`.

Attestations work in two modes:
- **Simulated (default)** — deterministic, offline; demos and CI in seconds.
- **Live** — when `PRIVATE_KEY` + `CONTRACT_ADDRESS` + `POLYGON_RPC_URL` are
  set, `/api/verify` submits a real `mint` transaction to Polygon Amoy and the
  returned tx hash is the on-chain proof.

## What's in the repo

```
src/verification/   verification engine + ML models + synthetic data
src/data-sources/   mock / Sentinel Hub / OpenWeather fetchers
src/storage/        repository layer (JSON-file + SQLite) + credits ledger
src/db/             low-level SQLite helpers
src/chain/          ledger abstraction (simulated + live EVM)
src/onchain/        canonical hashing + attestation + RPC checks
src/services/       claim orchestration (verify → persist → attest)
app/                Next.js UI: dashboard + map, certificates, teams, marketplace
app/api/            /api/verify, /api/claims..., /api/users...
scripts/            train, verify, submit, compile, deploy helpers
contracts/          CarbonTraceCredits.sol + compiled artifact
tests/              vitest suite (verification, hashing, storage)
```

## Quickstart

Requirements: **Node ≥ 23.4** (uses the built-in `node:sqlite`).

```bash
npm install
npm run dev       # http://localhost:3000
```

### Demo — no keys needed

```bash
npm run verify -- --type tree-planted --lat -26.2 --lon 28.05 --qty 40 --unit trees
npm run submit -- --type tree-planted --lat -26.2 --lon 28.05 --qty 40 --unit trees --agent school@alpha
```

### CLI / API reference

| Command | Purpose |
|---|---|
| `npm test` | Vitest suite (23 tests) |
| `npm run typecheck` | TypeScript check |
| `npm run train` | Retrain anomaly-detection MLP |
| `npm run compile` | Compile the Solidity contract |
| `npm run deploy` | Guided live-chain readiness check |
| `npm run submit -- ...` | Full pipeline: verify → store → attest |
| `POST /api/verify` | `{ claim: { claimType, lat, lon, quantity, unit, activityDate? }, agentRef?, note?, useModel? }` |
| `GET /api/claims?limit=&claimType=&includeSignals=1` | Claim list + stats |
| `GET /api/claims/:id` | Single stored claim (`{ result, claim, attestation, savedAt }`) |
| `GET /api/users/:agentRef` | Team account: user, credits, claims |

Verify a submitted claim on a live chain: pass the `dataHash` from the
certificate, take its keccak, and call `verifyHash` on the deployed contract
(`scripts/deploy-contract.ts` explains the steps).

## Going live (Polygon Amoy)

1. `npm run compile` — must produce `contracts/out/CarbonTraceCredits.json`.
2. Deploy `CarbonTraceCredits.sol` with your own tooling (Hardhat / Remix /
   Cast) to Polygon Amoy; note the address.
3. `.env`: set `POLYGON_RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`
   (optionally `COMMUNITY_ADDRESS` for the receiving account) and
   `USE_MOCK_DATA=false` plus Sentinel/OpenWeather keys for real data.
4. Restart — attestations now mint real on-chain CTC.

## Submission angle (for the hackathon)

- **The distinct innovation** is the verification engine: cross-referencing
  community-reported claims against independent satellite + weather data and
  an ML anomaly detector, with reproducible hashes on-chain.
- **Demo script** in `docs/updated plan.md`; original hardware vision (ESP32
  sensor nodes) is a planned extension, not a requirement.

## Roadmap

- Train the anomaly detector on public datasets (soil carbon, land-cover).
- Redeem marketplace redemptions through the ledger partner programme.
- IoT expansion: ESP32 + sensor nodes feed signed readings into the same
  verification pipeline (the "full" CarbonTrace vision).

## License

MIT — see [LICENSE](LICENSE).