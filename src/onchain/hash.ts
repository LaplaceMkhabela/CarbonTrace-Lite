import crypto from "node:crypto";
import type { VerificationResult } from "@/types/claim";

/**
 * Canonical claim hashing.
 *
 * The hash written to the ledger is a SHA-256 of a stable, key-sorted
 * serialization of the verification result's essence: claim + confidence +
 * status + timestamp + a per-claim nonce. Key-sorting guarantees that
 * two systems hashing the same claim produce the identical digest.
 */

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export interface HashInput {
  claimType: string;
  lat: number;
  lon: number;
  quantity: number;
  unit: string;
  activityDate?: string;
  confidence: number;
  status: string;
  creditsAwarded: number;
  createdAt: string;
  nonce: string;
}

export function hashVerification(result: VerificationResult, nonce?: string): string {
  const input: HashInput = {
    claimType: result.claim.claimType,
    lat: result.claim.lat,
    lon: result.claim.lon,
    quantity: result.claim.quantity,
    unit: result.claim.unit,
    activityDate: result.claim.activityDate,
    confidence: result.confidence,
    status: result.status,
    creditsAwarded: result.creditsAwarded,
    createdAt: result.createdAt,
    nonce: nonce ?? result.claimId,
  };
  return crypto.createHash("sha256").update(stableStringify(input), "utf8").digest("hex");
}

/** Short readable fingerprint for certificates / UI. */
export function fingerprint(dataHash: string): string {
  return `${dataHash.slice(0, 8)}…${dataHash.slice(-6)}`;
}