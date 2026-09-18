import { describe, it, expect } from "vitest";
import { claimSchema } from "../src/types/claim";
import { multiplierFor, multiplierTier, creditsAwarded } from "../src/verification/multipliers";
import { verifyClaim } from "../src/verification/engine";
import { buildFeatures } from "../src/verification/features";
import { generateDataset, toFeatureMatrix } from "../src/verification/synthetic-data";
import { fitIsolationForest, anomalyScore } from "../src/verification/isolation-forest";
import { trainANN, predict } from "../src/verification/ann";

const validClaim = {
  claimType: "tree-planted" as const,
  lat: -26.2,
  lon: 28.05,
  quantity: 40,
  unit: "trees",
  activityDate: "2025-03-01T00:00:00Z",
};

describe("claim schema", () => {
  it("accepts a valid claim", () => {
    expect(claimSchema.safeParse(validClaim).success).toBe(true);
  });

  it("rejects an unknown claim type", () => {
    expect(claimSchema.safeParse({ ...validClaim, claimType: "moon-colony" }).success).toBe(false);
  });

  it("rejects invalid coordinates", () => {
    expect(claimSchema.safeParse({ ...validClaim, lat: 95 }).success).toBe(false);
    expect(claimSchema.safeParse({ ...validClaim, lon: 190 }).success).toBe(false);
  });
});

describe("confidence → multiplier mapping", () => {
  it("gives full credits at 0.8", () => {
    expect(multiplierFor(0.8)).toBe(1);
    expect(multiplierTier(0.8)).toBe("verified");
  });

  it("gives half credits at 0.55", () => {
    expect(multiplierFor(0.55)).toBe(0.5);
    expect(multiplierTier(0.55)).toBe("partial");
  });

  it("gives nothing below 0.4", () => {
    expect(multiplierFor(0.2)).toBe(0);
    expect(multiplierTier(0.2)).toBe("flagged");
  });

  it("awards credits scaled by multiplier", () => {
    // 40 trees × 2 base credits × 1.0 = 80
    expect(creditsAwarded("tree-planted", 40, 0.85)).toBe(80);
    // 40 trees × 2 × 0.5 = 40
    expect(creditsAwarded("tree-planted", 40, 0.5)).toBe(40);
  });
});

describe("verification engine (end-to-end)", () => {
  it("returns a complete verification result for a tree-planting claim", async () => {
    const result = await verifyClaim(validClaim, { useModel: false });
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(["verified", "partial", "flagged"]).toContain(result.status);
    expect(result.signals.ndvi).not.toBeNull();
    expect(result.signals.provider.ndvi).toBe("mock");
    expect(result.signalsBreakdown.length).toBeGreaterThan(0);
    expect(result.creditsAwarded).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic for the same claim", async () => {
    const a = await verifyClaim(validClaim, { useModel: false });
    const b = await verifyClaim(validClaim, { useModel: false });
    expect(a.confidence).toBe(b.confidence);
    expect(a.signals.ndvi?.delta).toBe(b.signals.ndvi?.delta);
  });

  it("scales credits with claim quantity", async () => {
    const small = await verifyClaim({ ...validClaim, quantity: 20 }, { useModel: false });
    const large = await verifyClaim({ ...validClaim, quantity: 200 }, { useModel: false });
    expect(large.creditsAwarded).toBeGreaterThan(0);
    expect(large.creditsAwarded).toBeGreaterThan(small.creditsAwarded);
  });
});

describe("isolation forest anomaly model", () => {
  it("scores anomalous vectors higher than plausible ones", () => {
    const dataset = generateDataset({ perType: 120, seed: 42 });
    const X = toFeatureMatrix(dataset.features);
    const labels = dataset.labels;
    const forest = fitIsolationForest(X, { numTrees: 40, sampleSize: 64, seed: 42 });

    const scores = X.map((row) => anomalyScore(forest, row));
    const pos = scores.filter((_, i) => labels[i] === 1);
    const neg = scores.filter((_, i) => labels[i] === 0);
    const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;

    expect(mean(pos)).toBeGreaterThan(mean(neg));
  });

  it("feature vectors have the documented dimension and range", () => {
    const dataset = generateDataset({ perType: 5, seed: 1 });
    const f = dataset.features[0];
    const vec = toFeatureMatrix([f])[0];
    expect(vec).toHaveLength(7);
    for (const v of vec) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("anomaly-detection MLP", () => {
  it("classifies synthetic claims with high accuracy", () => {
    const dataset = generateDataset({ perType: 120, seed: 11 });
    const X = toFeatureMatrix(dataset.features);
    const y = dataset.labels;
    const { model, metrics } = trainANN(X, y, { hidden: 8, epochs: 80, seed: 11 });

    expect(metrics.accuracy).toBeGreaterThan(0.9);
    const pos = y.map((_, i) => predict(model, X[i])).filter((_, i) => y[i] === 1);
    const neg = y.map((_, i) => predict(model, X[i])).filter((_, i) => y[i] === 0);
    expect(pos.reduce((s, v) => s + v, 0) / pos.length).toBeGreaterThan(0.9);
    expect(neg.reduce((s, v) => s + v, 0) / neg.length).toBeLessThan(0.1);
  });
});

describe("feature construction", () => {
  it("omits ndvi feature gracefully when signals are missing", () => {
    const features = buildFeatures(validClaim, {
      ndvi: null,
      ndwi: null,
      weather: null,
      provider: { ndvi: "none", ndwi: "none", weather: "none" },
    });
    expect(features.ndviDelta).toBe(0.5); // neutral
    expect(features.ndviLevel).toBe(0.5);
  });
});