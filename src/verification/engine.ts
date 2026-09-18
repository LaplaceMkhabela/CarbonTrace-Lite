import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {
  Claim,
  VerificationResult,
  VerificationSignals,
  SignalSeries,
} from "@/types/claim";
import { claimSchema } from "@/types/claim";
import type { DataFetcher } from "@/data-sources/types";
import { buildDataFetcher } from "@/data-sources";
import { buildFeatures, featureVector } from "./features";
import { confidenceBreakdown } from "./scoring";
import { creditsAwarded, multiplierFor, multiplierTier } from "./multipliers";
import { predict, type ANNModel } from "./ann";
import {
  anomalyScore,
  type IsolationForestModel,
} from "./isolation-forest";

/**
 * The CarbonTrace verification engine.
 *
 * Pipeline:
 *   1. Validate the claim.
 *   2. Fetch independent signals (satellite + weather).
 *   3. Reduce to signal deltas.
 *   4. Build a feature vector.
 *   5. Score the claim with the rule-based model AND the ML anomaly detector.
 *   6. Emit confidence, status, multiplier and credits.
 */

const MODEL_PATH = path.join(process.cwd(), "data", "models", "anomaly-model.json");

type RuntimeModel = ANNModel | IsolationForestModel;

function scoreModel(model: RuntimeModel, sample: number[]): number {
  if (model.kind === "ann") return predict(model, sample);
  return anomalyScore(model, sample);
}

function seriesDelta(series: SignalSeries | null): { current: number; baseline: number; delta: number } | null {
  if (!series || series.points.length < 2) return null;
  const first = series.points[0];
  const last = series.points[series.points.length - 1];
  const baseline = first.v;
  const current = last.v;
  return { current, baseline, delta: current - baseline };
}

function loadModel(): RuntimeModel | null {
  try {
    if (!fs.existsSync(MODEL_PATH)) return null;
    const raw = fs.readFileSync(MODEL_PATH, "utf8");
    return JSON.parse(raw) as RuntimeModel;
  } catch {
    return null;
  }
}

let cachedModel: RuntimeModel | null | undefined;

function getModel(): RuntimeModel | null {
  if (cachedModel === undefined) cachedModel = loadModel();
  return cachedModel;
}

/** Lower the confidence when the anomaly detector flags the claim. */
function applyAnomalyDiscount(confidence: number, anomaly: number): number {
  return Math.max(0, Math.min(1, confidence * (1 - 0.5 * anomaly)));
}

export type VerifyOptions = {
  fetcher?: DataFetcher;
  /** Set to true to skip loading the trained model (tests / cold start). */
  useModel?: boolean;
};

export async function verifyClaim(input: unknown, options: VerifyOptions = {}): Promise<VerificationResult> {
  const claim: Claim = claimSchema.parse(input);
  const fetcher = options.fetcher ?? buildDataFetcher();

  const [ndviSeries, ndwiSeries, weather] = await Promise.all([
    fetcher.fetchNdvi(claim).catch(() => null),
    fetcher.fetchNdwi(claim).catch(() => null),
    fetcher.fetchWeather(claim).catch(() => null),
  ]);

  const signalsRaw = { ndvi: ndviSeries, ndwi: ndwiSeries };
  const signals: VerificationSignals = {
    ndvi: seriesDelta(ndviSeries),
    ndwi: seriesDelta(ndwiSeries),
    weather,
    provider: {
      ndvi: ndviSeries?.provider ?? "none",
      ndwi: ndwiSeries?.provider ?? "none",
      weather: weather?.provider ?? "none",
    },
  };

  const features = buildFeatures(claim, signals);
  const { signals: breakdown, confidence: rawConfidence, primaryAvailable } =
    confidenceBreakdown(claim, signals);

  const model = options.useModel === false ? null : getModel();
  const anomaly = model ? scoreModel(model, featureVector(features)) : 0;

  const confidence = applyAnomalyDiscount(rawConfidence, anomaly);
  const status = multiplierTier(confidence);
  const multiplier = multiplierFor(confidence);
  const credits = creditsAwarded(claim.claimType, claim.quantity, confidence);

  if (!primaryAvailable) {
    breakdown.push({
      name: "verification",
      value: 0,
      reason:
        "No independent primary source was available; the claim could not be cross-checked and was capped at partial.",
    });
  }

  const claimId = crypto
    .createHash("sha256")
    .update(JSON.stringify({ ...claim, t: new Date().toISOString() }))
    .digest("hex")
    .slice(0, 16);

  return {
    claimId,
    claim,
    signals,
    signalsRaw,
    confidence: Math.round(confidence * 1000) / 1000,
    anomalyScore: Math.round(anomaly * 1000) / 1000,
    status,
    multiplier,
    creditsAwarded: credits,
    signalsBreakdown: breakdown,
    createdAt: new Date().toISOString(),
  };
}