import type {
  Claim,
  ClaimType,
  ConfidenceSignal,
  VerificationSignals,
} from "@/types/claim";
import {
  quantityPlausibility,
  seasonFit,
  tempNormDiff,
} from "./features";

/**
 * Rule-based confidence scoring.
 *
 * Each claim type has a "primary" independent source it is cross-checked
 * against; the per-source signals are combined into a weighted raw confidence
 * in [0,1]. The anomaly-detection model later applies a small discount on top.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Green-up relative change, normalised so Δ=0.3 → ~1. */
function vegChangeScore(delta: number): number {
  return clamp01(delta / 0.3);
}

function moistureFit(precip: number, ideal: number): number {
  return clamp01(1 - Math.abs(precip - ideal) / ideal);
}

function tempFit(tempC: number, lo: number, hi: number): number {
  if (tempC < lo) return clamp01(0.5 + (tempC - lo) / 20);
  if (tempC > hi) return clamp01(0.5 - (tempC - hi) / 20);
  return 1;
}

export function confidenceBreakdown(
  claim: Claim,
  signals: VerificationSignals,
): {
  signals: ConfidenceSignal[];
  confidence: number;
  primaryAvailable: boolean;
} {
  const { claimType } = claim;
  const ndvi = signals.ndvi;
  const ndwi = signals.ndwi;
  const weather = signals.weather;

  const signalsList: ConfidenceSignal[] = [];
  let confidence = 0;

  switch (claimType) {
    case "tree-planted": {
      if (ndvi) {
        const veg = vegChangeScore(ndvi.delta);
        const level = clamp01((ndvi.current - 0.2) / 0.7);
        const combined = clamp01(0.6 * veg + 0.4 * level);
        signalsList.push({
          name: "ndvi",
          value: combined,
          reason: `Satellite NDVI ${ndvi.delta >= 0 ? "supports" : "contradicts"} the claim (current ${ndvi.current.toFixed(2)}, baseline ${ndvi.baseline.toFixed(2)}, Δ ${(ndvi.delta >= 0 ? "+" : "")}${ndvi.delta.toFixed(3)}).`,
        });
        confidence = 0.75 * combined;
      }
      break;
    }

    case "wetland-restoration": {
      if (ndwi) {
        const water = vegChangeScore(ndwi.delta);
        const level = clamp01((ndwi.current + 0.2) / 0.7);
        const combined = clamp01(0.6 * water + 0.4 * level);
        signalsList.push({
          name: "ndwi",
          value: combined,
          reason: `Satellite NDWI ${ndwi.delta >= 0 ? "supports" : "contradicts"} surface water increase (current ${ndwi.current.toFixed(2)}, baseline ${ndwi.baseline.toFixed(2)}, Δ ${(ndwi.delta >= 0 ? "+" : "")}${ndwi.delta.toFixed(3)}).`,
        });
        confidence = 0.75 * combined;
      }
      break;
    }

    case "composting": {
      if (weather) {
        const t = tempFit(weather.temperatureC, 10, 40);
        const m = moistureFit(weather.precipitationMm, 40);
        const dec = clamp01(0.5 * t + 0.5 * m);
        signalsList.push({
          name: "weather",
          value: dec,
          reason: `Weather supports aerobic decomposition (${weather.temperatureC.toFixed(1)}°C, ${weather.precipitationMm.toFixed(0)} mm).`,
        });
        confidence = 0.6 * dec;
      }
      break;
    }

    case "energy-saved": {
      if (weather) {
        const tnd = 1 - tempNormDiff(weather.temperatureC, weather.seasonalTempC);
        signalsList.push({
          name: "weather",
          value: tnd,
          reason: `Seasonal baseline is consistent with the reported savings period (${weather.temperatureC.toFixed(1)}°C vs norm ${weather.seasonalTempC.toFixed(1)}°C).`,
        });
        confidence = 0.5 * tnd;
      }
      break;
    }

    case "recycling": {
      // No independent satellite source; avoid over-trusting self-reported weight.
      break;
    }
  }

  const primaryAvailable = signalsList.length > 0;

  // Shared secondary signals.
  const sf = weather
    ? seasonFit(claimType, weather.seasonalTempC, weather.precipitationMm)
    : 0.5;
  const qp = quantityPlausibility(claimType, claim.quantity);

  const secondaryWeight = 0.3;
  confidence += secondaryWeight * (0.5 * sf + 0.5 * qp);

  signalsList.push({
    name: "quantity",
    value: qp,
    reason: `Claimed quantity ${claim.quantity} ${claim.unit} vs typical max ${qualityNote(qp)}.`,
  });
  signalsList.push({
    name: "season",
    value: sf,
    reason: `Action is ${sf >= 0.5 ? "consistent" : "inconsistent"} with the seasonal norm.`,
  });

  confidence = clamp01(confidence);

  return { signals: signalsList, confidence, primaryAvailable };
}

function qualityNote(qp: number): string {
  if (qp >= 0.85) return "well within the plausible range";
  if (qp >= 0.5) return "at the upper edge of plausible";
  return "implausibly high for one submission";
}