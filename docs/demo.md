# CarbonTrace Lite — Demo Slide Deck + YouTube Video Script

> Companion to the 4-minute hackathon script in `docs/demo-script.md`.
> This file is the long-form package: a 10-slide pitch deck plus a ~10-minute
> YouTube demo video script with chapters, narration, and upload checklist.
> Stats below mirror the live demo ledger (8 claims · 3 verified · 3 partial ·
> 2 flagged · 244 CTC) — glance at your dashboard before recording and adjust
> if the numbers moved.

---

## Part 1 — Slide Deck (10 slides)

### Slide 1 — Title
**CarbonTrace Lite — a verifiable community carbon ledger**
Sub: *Don't trust self-reported numbers. Verify them.*
Visual: dashboard screenshot (map + metric ribbon), dark theme.
Footer: repo URL · Polygon Amoy · MIT.

### Slide 2 — Problem
- Community environmental work (schools, farmers, crews) is **invisible and unrewarded**.
- Carbon markets serve corporations; communities are locked out.
- Most "green apps" are calculators that **trust whatever number you type**.
- Result: no proof, no credits, no incentive.

### Slide 3 — Solution (one-liner + loop)
- Log a local action → engine cross-checks it against **independent satellite + weather data** → verified credits (CTC) minted with an **on-chain attestation**.
- Loop diagram: `Report → Verify → Attest → Earn → Redeem`.

### Slide 4 — The verification engine (the innovation)
- Pipeline: Validate (Zod) → Fetch (NDVI/NDWI/weather) → 7-feature vector → **rule-based confidence + ML anomaly score** → status → multiplier → credits.
- Thresholds: ≥0.70 verified (×1.0) · 0.40–0.70 partial (×0.5) · <0.40 flagged (×0).
- Every verdict ships a human-readable per-signal breakdown.
- Screenshot: claim certificate with breakdown + data hash.

### Slide 5 — ML anomaly detection
- Dependency-free MLP (7→N→1, Adam) + isolation-forest alternative, no native deps.
- Trained on a synthetic fraud generator (flat signals, impossible quantities, out-of-season, combined fraud) — >90% accuracy on the suite.
- Retrain anytime: `npm run train`. Roadmap: public soil-carbon / land-cover datasets.

### Slide 6 — Independent data + on-chain proof
- Mock provider (zero keys, deterministic) → Sentinel Hub Statistical API + OpenWeather live when keys are set.
- `CarbonTraceCredits.sol`: `mint()` + `verifyHash()` on Polygon Amoy.
- Simulated attestation by default; real `mint` the moment keys + `CONTRACT_ADDRESS` are set (`npm run deploy` checks readiness).

### Slide 7 — Live product tour (map)
- Real Leaflet map, CARTO tiles, status pins: green check (verified), amber alert (partial), red X (flagged).
- Dashboard: metric ribbon, verification-ratio donut, issuance trend, review queue, searchable ledger with CSV export, dual dark/light theme.

### Slide 8 — Community impact
- Team dashboards (`/agents/<team>`): balance, split, history.
- Marketplace: credits → saplings, compost bins, tool vouchers, market discounts.
- Printable certificates with data hash / tx hash / sources.

### Slide 9 — Traction & verification (proof it runs)
- `npm test` → 23/23 passing · `npm run typecheck` → clean.
- Live demo ledger stats + a real certificate hash on screen.
- Quote the repo: verification methodology, integrations, contract, deployment guide all documented in `README.md`.

### Slide 10 — Ask / close
- Roadmap: public-dataset training, ledger-settled redemptions, ESP32 sensor nodes feeding the same pipeline.
- Ask: judges' vote / pilot schools & co-ops / contributors.
- End card: repo URL, demo URL, contact.

---

## Part 2 — YouTube Demo Video Script (~10 min)

**Setup (before recording):** `npm install` · `npm test` (green) · `npm run dev` open at `http://localhost:3000` · terminal ready with the two commands below · font scaled ≥150% · 1080p capture.

```bash
npm run verify -- --type tree-planted --lat -26.2 --lon 28.05 --qty 40 --unit trees
npm run submit -- --type tree-planted --lat -26.2 --lon 28.05 --qty 40 --unit trees --agent school@alpha
```

### 0:00–0:45 — Hook + problem (Ch. 1)
*[Talking head or title cards over dashboard B-roll]*
> "A school plants 40 trees. Nobody can prove it — so nobody pays for it. Carbon markets serve corporations, and every green app out there just trusts whatever number you type in. CarbonTrace Lite doesn't trust. It verifies. In the next ten minutes: a live claim, the engine that scores it, the ML model that catches fraud, on-chain proof, and the community economy it unlocks."

### 0:45–2:30 — Live claim submission (Ch. 2)
1. Dashboard tour (15s): metric ribbon, donut, trend.
2. Fill **Submit a claim**: tree-planted · 40 trees · school@alpha → submit.
3. Show inline result: confidence, partial/verified status, CTC awarded.
4. Open the certificate (`/claims/<id>`): data hash, tx hash, sources, print/export.
> "Forty trees, one form, and back comes a verdict with receipts — not just a number."

### 2:30–4:30 — Verification engine deep-dive (Ch. 3)
Walk `src/verification/engine.ts` stages on screen:
1. **Validate** (Zod schema) → 2. **Fetch** NDVI/NDWI/weather (mock offline; Sentinel Hub + OpenWeather live with keys) → 3. **Features** (7-vector) → 4. **Score twice** (rules in `scoring.ts` + ML) → 5. **Emit** status/multiplier/credits.
- Adversarial demo: submit `--qty 99999` → flagged, anomaly ≈100%.
> "Flat satellite signal, impossible quantity — the rules wobble it, the neural net calls it."

### 4:30–6:00 — ML anomaly detection (Ch. 4)
- `ann.ts` MLP + `isolation-forest.ts`, synthetic fraud generator, `npm run train`, >90% suite accuracy.
- Note the honest limitation: synthetic data today, public datasets on the roadmap.

### 6:00–7:30 — On-chain proof (Ch. 5)
- Run the `npm run submit` CLI; point at data hash → fingerprint → tx hash.
- `contracts/CarbonTraceCredits.sol`: `mint` + `verifyHash`; `npm run compile` / `npm run deploy`.
- Simulated default vs. live Polygon Amoy mint with keys set.

### 7:30–9:00 — Community layer (Ch. 6)
- Map: filter pills (All/Verified/Partial/Flagged), pin popups → certificates.
- Team page (`/agents/school@alpha`): balance, split, history.
- Marketplace: redeem CTC for saplings, compost bins, vouchers.
- Toggle light theme; export ledger CSV.

### 9:00–10:00 — Proof, roadmap, close (Ch. 7)
- `npm test` green (23/23), `typecheck` clean, README methodology.
- Roadmap: public data, ledger-settled redemptions, ESP32 sensors.
> "Trust layer for community climate action — links below. If your school or co-op wants to pilot it, reach out."
- End screen: repo link + subscribe.

---

## Part 3 — YouTube Upload Checklist

- **Title:** `CarbonTrace Lite — Verifiable Community Carbon Credits (Live Demo + How It Works)`
- **Description:** one-paragraph pitch + chapters (timestamps above) + repo link + stack (Next.js, Leaflet/CARTO, Sentinel Hub, OpenWeather, Polygon Amoy, ethers) + `npm install && npm run dev` quickstart + honesty note (simulated attestation default, synthetic ML data).
- **Tags:** carbon credits, carbon ledger, verification engine, satellite NDVI, polygon, hackathon demo, climate tech, nextjs.
- **Thumbnail:** map with three status pins + "DON'T TRUST. VERIFY." + CTC coin badge. High contrast, ≤3 words besides logo.
- **Cards/end screen:** link repo at 0:45 (claim demo) and 9:00 (close); end screen = repo + subscribe.
- **Recording QA:** 1080p+, UI ≥150%, terminal pre-warmed (run each command once), mic check, 3s silence buffers around edits, hard-refresh before the map shot (bust tile cache).
