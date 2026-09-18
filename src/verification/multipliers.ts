import { BASE_CREDITS_PER_UNIT } from "@/types/claim";

/**
 * Confidence → credit multiplier mapping.
 *
 *   ≥ 0.70 → full credits (×1.0)       status: verified
 *   0.40–0.70 → partial credits (×0.5) status: partial
 *   < 0.40 → no credits, flagged       status: flagged
 */

export const THRESHOLD_VERIFIED = 0.7;
export const THRESHOLD_PARTIAL = 0.4;

export const MULTIPLIER_VERIFIED = 1;
export const MULTIPLIER_PARTIAL = 0.5;
export const MULTIPLIER_FLAGGED = 0;

export type MultiplierTier = "verified" | "partial" | "flagged";

export function multiplierTier(confidence: number): MultiplierTier {
  if (confidence >= THRESHOLD_VERIFIED) return "verified";
  if (confidence >= THRESHOLD_PARTIAL) return "partial";
  return "flagged";
}

export function multiplierFor(confidence: number): number {
  switch (multiplierTier(confidence)) {
    case "verified":
      return MULTIPLIER_VERIFIED;
    case "partial":
      return MULTIPLIER_PARTIAL;
    default:
      return MULTIPLIER_FLAGGED;
  }
}

export function baseCreditsFor(claimType: string, quantity: number): number {
  const perUnit = BASE_CREDITS_PER_UNIT[claimType as keyof typeof BASE_CREDITS_PER_UNIT] ?? 0;
  return perUnit * quantity;
}

export function creditsAwarded(claimType: string, quantity: number, confidence: number): number {
  return Math.round((baseCreditsFor(claimType, quantity) * multiplierFor(confidence)) * 100) / 100;
}