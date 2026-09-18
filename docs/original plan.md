# Winning Idea: CarbonTrace — A Community Carbon Sink Verification Network

## 1. Why This Idea Wins

**What NextStep Hacks 2026 judges will see** (based on the theme, submission rules, and 815 participants):

| What most teams will submit | What judges will be tired of | CarbonTrace's difference |
|---|---|---|
| Carbon footprint calculator web app | Another "enter miles → show CO₂" | Physical sensors + on-chain verification + community incentives |
| Recycling classification app | A pretrained model wrapped in a UI | Edge deployment + real deployment path |
| Climate data dashboard | Pulling a Kaggle dataset and plotting it | End-to-end system: hardware, software, and economic model |
| Solar panel calculator | Static formula wrapper | Real-time data + verifiable carbon credits |

**Core insight**: This is a **beginner-friendly** hackathon. Most submissions will be **pure software, pure frontend, no real data**. A project that combines **hardware + software + social innovation** will dominate on creativity, execution, and impact — even with moderate technical depth.

**Theme fit**: Earth Forward explicitly lists "conservation, sustainable agriculture, waste reduction, climate resilience." CarbonTrace directly hits **conservation + climate resilience + community adaptation**.


## 2. Project Overview

**One-liner**: A low-cost IoT sensor network that lets communities, schools, and small farmers **measure, verify, and trade** local carbon sink data (trees, soil, wetlands) in real time — turning environmental action into verifiable, incentivized community participation.

**Problem**: Carbon credit markets are dominated by corporations. Verification is expensive. Communities and small farmers are locked out. Meanwhile, most "green apps" only estimate — they don't measure.

**Solution**:
1. **Hardware layer**: $15 ESP32 + soil moisture/temperature/CO₂ sensor nodes
2. **Edge layer**: Nodes compute carbon sink estimates locally (TinyML, works offline)
3. **Verification layer**: Data hashes go on-chain (Polygon testnet), generating verifiable carbon sink certificates
4. **Community layer**: Web app shows a community carbon map; points redeemable for local rewards (saplings, tools, market discounts)


## 3. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│  HARDWARE LAYER: ESP32 + sensor nodes ($15/unit)         │
│  - Soil moisture/temp, air CO₂, light, GPS               │
│  - LoRa / WiFi, solar-powered                            │
└──────────────────────┬──────────────────────────────────┘
                       │ MQTT
┌──────────────────────▼──────────────────────────────────┐
│  EDGE LAYER: TinyML carbon sink estimation               │
│  - TensorFlow Lite Micro, <100KB                         │
│  - Local soil carbon flux computation, offline-capable   │
│  - Data signing + hashing                                │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│  VERIFICATION LAYER: Polygon testnet                     │
│  - Data hashes on-chain, CarbonTrace certificates        │
│  - Smart contract: CarbonTrace Credits (CTC) mint/transfer│
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  APPLICATION LAYER: React Web App                        │
│  - Community carbon map (real-time)                      │
│  - Personal/school carbon dashboard                      │
│  - Points marketplace (saplings, tools, local discounts) │
│  - Carbon certificate export (for education/volunteering)│
└─────────────────────────────────────────────────────────┘
```


## 4. 6-Day Execution Plan (fits hackathon cycle)

| Day | Task | Deliverable |
|---|---|---|
| **Day 1** | Hardware assembly + sensor calibration | 1 working sensor node, data readable |
| **Day 2** | Edge TinyML model training + deployment | Node outputs carbon estimates locally |
| **Day 3** | Backend + MQTT + data pipeline | Data flows from node to database |
| **Day 4** | Smart contract + on-chain verification | Data hash queryable on testnet |
| **Day 5** | Frontend web app + map | Live map + dashboard demoable |
| **Day 6** | Demo video + README + submission | Complete submission package |


## 5. Submission Strategy

**Demo video script (4 minutes)**:

| Time | Content |
|---|---|
| 0:00–0:30 | Problem: carbon markets exclude communities; green apps only estimate |
| 0:30–1:30 | Hardware demo: real sensor node, live soil data |
| 1:30–2:30 | Edge AI: local carbon estimation on the node, offline-capable |
| 2:30–3:15 | On-chain verification: data hash on-chain, certificate generated |
| 3:15–4:00 | Community impact: how schools/farmers redeem points for rewards |

**README core sections**:
- Hardware BOM (bill of materials) and cost
- Sensor calibration methodology
- TinyML model architecture and training data
- Smart contract address (testnet)
- Deployment guide (so judges can reproduce)
- Real deployment case (even if it's just your backyard or school garden)

**Key bonus point**: In your Devpost, explicitly state — if this is a continuation project, **what was done during the hackathon vs. before** (the rules explicitly require this).


## 6. Why This Works Against 815 Participants

| Judging dimension (implied) | CarbonTrace's answer |
|---|---|
| **Creativity** | Hardware + AI + blockchain + community economy — four layers of innovation |
| **Execution** | Completable in 6 days, demoable deliverable each day |
| **Impact** | Directly empowers communities, replicable to schools/farms |
| **Theme fit** | Hits conservation + climate resilience + sustainable agriculture |
| **Technical feasibility** | ESP32 + TensorFlow Lite + Polygon are all mature tech |
| **Presentation quality** | A physical hardware demo is extremely persuasive on video |

**Biggest advantage**: Most teams will submit **pure software** projects. A **hardware node you can hold in your hand** will immediately grab judges' attention in the demo video. And the "community carbon sink + points economy" social innovation narrative directly hits Earth Forward's "community adaptation" and "conservation."


## 7. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Hardware not ready in 6 days | Day 1: just 1 node, no network needed |
| TinyML model not accurate enough | Pretrain on public soil carbon datasets; only optimize inference during hackathon |
| Blockchain part too complex | Only do testnet hash attestation, no full DeFi |
| Judges can't reproduce | README provides full BOM + wiring diagram + code |

**If hardware falls through**: Degrade to "phone sensors + manual input + on-chain verification" — core narrative still intact.


**Want me to go deeper on any part?** For example: the TinyML model architecture, the smart contract code framework, or a line-by-line script for the 4-minute demo video.