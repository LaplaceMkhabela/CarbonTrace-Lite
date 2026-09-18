import type {
  Claim,
  ClaimType,
  VerificationSignals,
} from "@/types/claim";
import { TYPICAL_QUANTITY_MAX } from "@/types/claim";

/**
 * Feature engineering for the anomaly-detection model.
 *
 * A claim becomes a fixed-length feature vector in [0,1]. The vector captures
 * the signals the verification process itself produced, so the isolation forest
 * learns the *shape* of suspicious claims (e.g. "tree planted" + flat NDVI +
 * implausible quantity).
 */

export const FEATURE_NAMES = [
  "ndviDelta",
  "ndviLevel",
  "ndwiDelta",
  "tempNormDiff",
  "precipNorm",
  "seasonFit",
  "quantityPlausibility",
] as const;

export type FeatureName = (typeof FEATURE_NAMES)[number];

export interface ClaimFeatures {
  ndviDelta: number;
  ndviLevel: number;
  ndwiDelta: number;
  tempNormDiff: number;
  precipNorm: number;
  seasonFit: number;
  quantityPlausibility: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const NEUTRAL = 0.5;

/* ---------- helper signals used by both scoring and features ---------- */

export function quantityPlausibility(type: ClaimType, quantity: number): number {
  const cap = TYPICAL_QUANTITY_MAX[type];
  if (quantity <= cap) return 0.9;
  return clamp01(0.9 * Math.exp(-(quantity - cap) / cap));
}

export function tempNormDiff(temperatureC: number, seasonalTempC: number): number {
  return clamp01(Math.abs(temperatureC - seasonalTempC) / 20);
}

export function precipNorm(precipitationMm: number): number {
  return clamp01(precipitationMm / 100);
}

/** Does the claimed action make sense for this season? 0..1. */
export function seasonFit(type: ClaimType, normTempC: number, precip: number): number {
  switch (type) {
    case "tree-planted":
      // Trees prefer moderate planting temps (~12–24°C). Extreme heat/cold is suspect.
      return clamp01(1 - Math.abs(normTempC - 18) / 22);
    case "composting":
      // Warmth helps decomposition year-round; zero warmth (deep winter) is less plausible.
      return clamp01(0.5 + (0.5 * normTempC) / 30);
    case "wetland-restoration":
      // Water-dependent action is most plausible in the wet season.
      return clamp01(0.25 + 0.75 * (precip / 100));
    case "recycling":
      return 0.8; // seasonally neutral
    case "energy-saved": {
      // Savings are plausible year-round; mildly more in moderate weather.
      return 0.7 + 0.3 * clamp01(1 - Math.abs(normTempC - 15) / 20);
    }
  }
}

/* ---------- feature vector construction ---------- */

export function buildFeatures(
  claim: Claim,
  signals: VerificationSignals,
): ClaimFeatures {
  const weather = signals.weather;

  return {
    ndviDelta: signals.ndvi ? clamp01(signals.ndvi.delta) : NEUTRAL,
    ndviLevel: signals.ndvi ? clamp01(signals.ndvi.current) : NEUTRAL,
    ndwiDelta: signals.ndwi ? clamp01(signals.ndwi.delta) : NEUTRAL,
    tempNormDiff:
      weather?.seasonalTempC != null
        ? tempNormDiff(weather.temperatureC, weather.seasonalTempC)
        : NEUTRAL,
    precipNorm: weather ? precipNorm(weather.precipitationMm) : NEUTRAL,
    seasonFit: weather
      ? seasonFit(claim.claimType, weather.seasonalTempC, weather.precipitationMm)
      : NEUTRAL,
    quantityPlausibility: quantityPlausibility(claim.claimType, claim.quantity),
  };
}

export function featureVector(f: ClaimFeatures): number[] {
  return FEATURE_NAMES.map((name) => f[name]);
}

export function featuresFromVector(v: number[]): ClaimFeatures {
  const obj: Record<string, number> = {};
  FEATURE_NAMES.forEach((name, i) => {
    obj[name] = v[i] ?? NEUTRAL;
  });
  return obj as unknown as ClaimFeatures;
}