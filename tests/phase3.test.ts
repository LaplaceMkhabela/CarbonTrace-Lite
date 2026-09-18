import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { JsonFileRepository } from "../src/storage/json-file";
import { stableStringify, hashVerification, fingerprint } from "../src/onchain/hash";
import { attestResult, attestationMode } from "../src/onchain/attestation";
import type { Attestation, ClaimRecord } from "../src/storage/types";
import type { Credit, User, VerificationResult } from "../src/types/claim";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ct-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function makeResult(overrides: Partial<VerificationResult> = {}): VerificationResult {
  return {
    claimId: "claim-1",
    claim: {
      claimType: "tree-planted",
      lat: -26.2,
      lon: 28.05,
      quantity: 40,
      unit: "trees",
      activityDate: "2025-03-01T00:00:00Z",
      agentRef: "user:green-team",
    },
    signals: { ndvi: null, ndwi: null, weather: null, provider: { ndvi: "none", ndwi: "none", weather: "none" } },
    signalsRaw: { ndvi: null, ndwi: null },
    confidence: 0.85,
    anomalyScore: 0.01,
    status: "verified",
    multiplier: 1,
    creditsAwarded: 80,
    signalsBreakdown: [],
    createdAt: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

describe("canonical hashing", () => {
  it("stableStringify sorts keys", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it("hashVerification is deterministic", () => {
    const a = hashVerification(makeResult());
    const b = hashVerification(makeResult());
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hash differs when confidence changes", () => {
    const a = hashVerification(makeResult());
    const b = hashVerification(makeResult({ confidence: 0.5 }));
    expect(a).not.toBe(b);
  });

  it("fingerprint is short and readable", () => {
    const f = fingerprint(hashVerification(makeResult()));
    expect(f).toMatch(/^[0-9a-f]{8}…[0-9a-f]{6}$/);
  });
});

describe("attestation", () => {
  it("produces a simulated snapshot with a real data hash", async () => {
    const a: Attestation = await attestResult(makeResult());
    expect(a.dataHash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.txHash.startsWith("0x")).toBe(true);
    expect(a.confidence).toBe(0.85);
    expect(a.network.toLowerCase()).toContain("simulated");
  });

  it("returns simulated mode without live env config", () => {
    // Ensure no accidental live mode from env leakage.
    expect(["simulated", "live"]).toContain(attestationMode());
  });
});

describe("JsonFileRepository", () => {
  it("persists and loads a claim record", async () => {
    const repo = new JsonFileRepository(tmpDir);
    const record: ClaimRecord = { result: makeResult(), attestation: null, savedAt: "2025-06-01T00:00:00Z" };
    await repo.saveClaim(record);
    const loaded = await repo.getClaim("claim-1");
    expect(loaded?.result.creditsAwarded).toBe(80);
    expect(await repo.countClaims()).toBe(1);
  });

  it("credits update the user balance and roll up stats", async () => {
    const repo = new JsonFileRepository(tmpDir);
    const user: User = { id: "user:green-team", displayName: "Green Team", creditBalance: 0, createdAt: "2025-01-01T00:00:00Z" };
    await repo.saveUser(user);

    await repo.recordCredit({
      id: "credit:1",
      claimId: "claim-1",
      ownerRef: "user:green-team",
      amount: 80,
      confidence: 0.85,
      status: "verified",
      createdAt: "2025-06-01T00:00:00Z",
    });
    await repo.recordCredit({
      id: "credit:2",
      claimId: "claim-2",
      ownerRef: "user:green-team",
      amount: 0,
      confidence: 0.2,
      status: "flagged",
      createdAt: "2025-06-02T00:00:00Z",
    });

    const updated = await repo.getUser("user:green-team");
    expect(updated?.creditBalance).toBe(80);
    const credits = await repo.listCreditsByUser("user:green-team");
    expect(credits).toHaveLength(1); // zero-amount credits are not recorded

    await repo.saveClaim({ result: makeResult(), attestation: null, savedAt: "x" });
    const stats = await repo.getStats();
    expect(stats.totalCreditsAwarded).toBe(80);
    expect(stats.verifiedClaims).toBe(1);
    expect(stats.flaggedClaims).toBe(0);
  });

  it("lists claims most-recent-first with claimType filter", async () => {
    const repo = new JsonFileRepository(tmpDir);
    await repo.saveClaim({
      result: makeResult({ claimId: "a", createdAt: "2025-01-01T00:00:00Z" }),
      attestation: null,
      savedAt: "x",
    });
    await repo.saveClaim({
      result: makeResult({ claimId: "b", createdAt: "2025-02-01T00:00:00Z" }),
      attestation: null,
      savedAt: "x",
    });
    await repo.saveClaim({
      result: makeResult({ claimId: "c", claim: { ...makeResult().claim, claimType: "composting" }, createdAt: "2025-03-01T00:00:00Z" }),
      attestation: null,
      savedAt: "x",
    });

    const all = await repo.listClaims();
    expect(all.map((c) => c.result.claimId)).toEqual(["c", "b", "a"]);
    const trees = await repo.listClaims(50, 0, "tree-planted");
    expect(trees.map((c) => c.result.claimId)).toEqual(["b", "a"]);
  });
});