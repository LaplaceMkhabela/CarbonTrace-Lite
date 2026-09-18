import type { ClaimType } from "@/types/claim";
import { FEATURE_NAMES, type ClaimFeatures, type FeatureName } from "./features";

/**
 * Synthetic data generator for the anomaly-detection model.
 *
 * Generates feature vectors for plausible (legitimate) and implausible
 * (fraudulent / mistaken) claims. The generator encodes *how fraud looks* in
 * feature space: flat satellite signals, implausible quantities, impossible
 * seasonal windows, etc.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRandom(seed: number) {
  const rand = mulberry32(seed);
  return {
    rand,
    between: (lo: number, hi: number) => lo + rand() * (hi - lo),
  };
}

export interface SyntheticDataset {
  features: ClaimFeatures[];
  labels: number[]; // 0 = legitimate, 1 = anomalous
  byType: Record<ClaimType, { plausible: number; anomalous: number }>;
}

export interface GenerateOptions {
  /** Plausible samples per claim type (default 300). */
  perType?: number;
  /** Anomalous samples per claim type (default perType / 5). */
  anomaliesPerType?: number;
  seed?: number;
}

const TYPES: ClaimType[] = [
  "tree-planted",
  "composting",
  "recycling",
  "energy-saved",
  "wetland-restoration",
];

/** Per-claim-type sampling means for plausibility features. */
const PLACERS: Record<
  ClaimType,
  { qLo: number; qHi: number; sLo: number; sHi: number }
> = {
  "tree-planted": { qLo: 0.75, qHi: 1, sLo: 0.7, sHi: 1 },
  "composting": { qLo: 0.7, qHi: 1, sLo: 0.65, sHi: 0.95 },
  "recycling": { qLo: 0.7, qHi: 1, sLo: 0.5, sHi: 0.9 },
  "energy-saved": { qLo: 0.7, qHi: 1, sLo: 0.6, sHi: 0.9 },
  "wetland-restoration": { qLo: 0.7, qHi: 1, sLo: 0.6, sHi: 0.95 },
};

const MODEL_MAP: Record<ClaimType, 0 | 1 | 2> = {
  // 0 = NDVI-based (vegetation), 1 = NDWI-based (water), 2 = weather-based
  "tree-planted": 0,
  "recycling": 2,
  "composting": 2,
  "energy-saved": 2,
  "wetland-restoration": 1,
};

function plausibleVector(type: ClaimType, r: ReturnType<typeof makeRandom>): ClaimFeatures {
  const p = PLACERS[type];
  const model = MODEL_MAP[type];

  return {
    ndviDelta: model === 0 ? r.between(0.12, 0.42) : r.between(0.05, 0.2),
    ndviLevel: model === 0 ? r.between(0.35, 0.75) : r.between(0.25, 0.55),
    ndwiDelta: model === 1 ? r.between(0.1, 0.35) : r.between(-0.05, 0.12),
    tempNormDiff: r.between(0.02, 0.35),
    precipNorm: r.between(0.15, 0.7),
    seasonFit: r.between(p.sLo, p.sHi),
    quantityPlausibility: r.between(p.qLo, p.qHi),
  };
}

function anomalousVector(type: ClaimType, r: ReturnType<typeof makeRandom>): ClaimFeatures {
  const model = MODEL_MAP[type];

  // Anomalies are *coherent* fraud patterns: at least two features are pushed
  // decisively to the margins of the plausible envelope, and the primary
  // satellite signal used to verify the claim is contradicted.
  const pattern = r.rand(); // 0..1
  const base = plausibleVector(type, r);

  if (pattern < 0.4) {
    // "Nothing really happened": the independent source is flat/negative and
    // the site looks barren, regardless of what was claimed.
    if (model === 0) {
      base.ndviDelta = clamp01(r.between(-0.05, 0.03));
      base.ndviLevel = r.between(0.12, 0.3);
    } else if (model === 1) {
      base.ndwiDelta = clamp01(r.between(-0.12, 0.01));
    } else {
      base.ndviDelta = clamp01(r.between(-0.02, 0.05));
    }
  } else if (pattern < 0.7) {
    // "Over-claim": huge quantity with weak / impossible evidence.
    base.quantityPlausibility = r.between(0.0, 0.1);
    if (model === 0) base.ndviDelta = clamp01(r.between(0.0, 0.08));
    else if (model === 1) base.ndwiDelta = clamp01(r.between(-0.02, 0.06));
  } else if (pattern < 0.9) {
    // "Out of season / impossible weather".
    base.seasonFit = r.between(0.0, 0.08);
    base.tempNormDiff = r.between(0.85, 1);
    base.precipNorm = r.between(0.9, 1);
  } else {
    // "Combined fraud": several dimensions simultaneously impossible.
    base.ndviDelta = clamp01(r.between(-0.06, 0.05));
    base.quantityPlausibility = r.between(0.0, 0.18);
    base.seasonFit = r.between(0.0, 0.12);
    base.tempNormDiff = r.between(0.6, 1);
  }
  return base;
}

export function generateDataset(options: GenerateOptions = {}): SyntheticDataset {
  const perType = options.perType ?? 300;
  const anomaliesPerType = options.anomaliesPerType ?? Math.max(1, Math.round(perType / 5));
  const seed = options.seed ?? 1337;
  const features: ClaimFeatures[] = [];
  const labels: number[] = [];
  const byType = {} as SyntheticDataset["byType"];

  TYPES.forEach((type, typeIdx) => {
    const r = makeRandom(seed + typeIdx * 7919);
    const plausible: ClaimFeatures[] = [];
    const anomalous: ClaimFeatures[] = [];
    for (let i = 0; i < perType; i++) {
      plausible.push(plausibleVector(type, r));
    }
    for (let i = 0; i < anomaliesPerType; i++) {
      anomalous.push(anomalousVector(type, r));
    }
    features.push(...plausible, ...anomalous);
    labels.push(...plausible.map(() => 0), ...anomalous.map(() => 1));
    byType[type] = { plausible: plausible.length, anomalous: anomalous.length };
  });

  return { features, labels, byType };
}

export function toFeatureMatrix(features: ClaimFeatures[]): number[][] {
  return features.map((f) => FEATURE_NAMES.map((name: FeatureName) => f[name]));
}