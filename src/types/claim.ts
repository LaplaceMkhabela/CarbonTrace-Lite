import { z } from "zod";

/**
 * Shared data models for CarbonTrace Lite.
 *
 * These are the core domain types used across the data-source clients, the
 * verification engine, the API, and (later) the on-chain layer.
 */

export const CLAIM_TYPES = [
  "tree-planted",
  "composting",
  "recycling",
  "energy-saved",
  "wetland-restoration",
] as const;

export type ClaimType = (typeof CLAIM_TYPES)[number];

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  "tree-planted": "Tree planted",
  "composting": "Composting",
  "recycling": "Recycling",
  "energy-saved": "Energy saved",
  "wetland-restoration": "Wetland restoration",
};

export const baseCreditsSchema = z.object({
  claimType: z.enum(CLAIM_TYPES),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  activityDate: z.string().datetime().optional(),
  agentRef: z.string().optional(),
  note: z.string().optional(),
});

export type Claim = z.infer<typeof baseCreditsSchema>;

export interface CompletedClaim extends Claim {
  id: string;
  submittedAt: string;
  submittedBy?: string;
}

export type VerificationStatus = "verified" | "partial" | "flagged";

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  verified: "Verified — full credits",
  partial: "Partially verified — half credits",
  flagged: "Flagged for community review",
};

export interface SignalSeries {
  points: Array<{ t: string; v: number }>;
  provider: string;
}

export interface SignalWeather {
  temperatureC: number;
  seasonalTempC: number;
  precipitationMm: number;
  seasonalPrecipMm: number;
  provider: string;
}

/** Raw observations pulled from independent data sources. */
export interface VerificationSignals {
  ndvi: { current: number; baseline: number; delta: number } | null;
  ndwi: { current: number; baseline: number; delta: number } | null;
  weather: SignalWeather | null;
  provider: { ndvi: string; ndwi: string; weather: string };
}

export type ConfidenceSignal = {
  name: string;
  value: number;
  reason: string;
};

export interface VerificationResult {
  claimId: string;
  claim: Claim;
  signals: VerificationSignals;
  signalsRaw: {
    ndvi: SignalSeries | null;
    ndwi: SignalSeries | null;
  };
  confidence: number;
  anomalyScore: number;
  status: VerificationStatus;
  multiplier: number;
  creditsAwarded: number;
  signalsBreakdown: ConfidenceSignal[];
  createdAt: string;
}

export interface Credit {
  id: string;
  claimId: string;
  ownerRef: string;
  amount: number;
  confidence: number;
  status: VerificationStatus;
  createdAt: string;
  attestationTxHash?: string;
}

export interface User {
  id: string;
  displayName: string;
  locationLabel?: string;
  communityRef?: string;
  creditBalance: number;
  createdAt: string;
}

/* ---------- Zod validation schema (API input) ---------- */

export const claimSchema = z.object({
  claimType: z.enum(CLAIM_TYPES),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  activityDate: z.string().datetime().optional(),
  agentRef: z.string().optional(),
  note: z.string().optional(),
});

export type ClaimInput = z.infer<typeof claimSchema>;

/* ---------- Credit model basis ---------- */

/** Base credits per unit of claim, per type. */
export const BASE_CREDITS_PER_UNIT: Record<ClaimType, number> = {
  "tree-planted": 2, // per tree
  "composting": 0.1, // per 1 kg
  "recycling": 0.04, // per 1 kg
  "energy-saved": 0.02, // per 1 kWh
  "wetland-restoration": 5, // per 1 m2
};

/**
 * Plausible typical quantity range per claim (per single submission).
 * Used to derive a 0..1 "quantity plausibility" feature.
 */
export const TYPICAL_QUANTITY_MAX: Record<ClaimType, number> = {
  "tree-planted": 1000, // trees
  "composting": 500, // kg
  "recycling": 2000, // kg
  "energy-saved": 1000, // kWh (monthly)
  "wetland-restoration": 5000, // m2
};