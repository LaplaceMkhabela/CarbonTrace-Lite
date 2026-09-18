import { randomUUID } from "node:crypto";
import type {
  Claim,
  ClaimType,
  VerificationResult,
  VerificationStatus,
} from "@/types/claim";
import { getDatabase, claimRowToClaim, userRowToUser } from "./database";

/**
 * SQL repository for claims, users and attestations.
 */

export interface StoredClaim {
  id: string;
  claimType: ClaimType;
  lat: number;
  lon: number;
  quantity: number;
  unit: string;
  activityDate?: string;
  agentRef?: string;
  note?: string;
  confidence: number;
  anomalyScore: number;
  status: VerificationStatus;
  multiplier: number;
  creditsAwarded: number;
  claimHash: string;
  signals: unknown;
  signalsRaw: unknown;
  signalsBreakdown: unknown;
  submittedAt: string;
  attestation: { id: string | null; txHash: string | null; blockNumber: number | null };
}

export interface AttestationRecord {
  id: string;
  claimId: string;
  claimHash: string;
  chain: string;
  txHash: string;
  blockNumber: number;
  attestedAt: string;
}

export function upsertUser(input: { id: string; displayName: string; locationLabel?: string }): void {
  const db = getDatabase();
  const existing = db.prepare<Record<string, unknown>>("SELECT id FROM users WHERE id = ?").get(input.id);
  if (existing) {
    db.prepare("UPDATE users SET display_name = ?, location_label = ? WHERE id = ?").run(
      input.displayName,
      input.locationLabel ?? null,
      input.id,
    );
  } else {
    db.prepare("INSERT INTO users (id, display_name, location_label) VALUES (?, ?, ?)").run(
      input.id,
      input.displayName,
      input.locationLabel ?? null,
    );
  }
}

export function getUser(id: string) {
  const row = getDatabase().prepare<Record<string, unknown>>("SELECT * FROM users WHERE id = ?").get(id);
  return row ? userRowToUser(row) : null;
}

export function saveClaim(result: VerificationResult, agentRef?: string, note?: string): StoredClaim {
  const db = getDatabase();
  const claim: Claim = result.claim;
  const id = result.claimId;

  if (agentRef && !getUser(agentRef)) {
    upsertUser({ id: agentRef, displayName: agentRef });
  }

  db.prepare(
    `INSERT INTO claims (
      id, claim_type, lat, lon, quantity, unit, activity_date, agent_ref, note,
      confidence, anomaly_score, status, multiplier, credits_awarded, claim_hash,
      signals_json, signals_raw_json, breakdown_json, submitted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    claim.claimType,
    claim.lat,
    claim.lon,
    claim.quantity,
    claim.unit,
    claim.activityDate ?? null,
    agentRef ?? null,
    note ?? null,
    result.confidence,
    result.anomalyScore,
    result.status,
    result.multiplier,
    result.creditsAwarded,
    result.claimId,
    JSON.stringify(result.signals),
    JSON.stringify(result.signalsRaw),
    JSON.stringify(result.signalsBreakdown),
    result.createdAt,
  );

  return getClaim(id)!;
}

export function getClaim(id: string): StoredClaim | null {
  const row = getDatabase()
    .prepare<Record<string, unknown>>("SELECT * FROM claims WHERE id = ?")
    .get(id);
  return row ? (claimRowToClaim(row) as StoredClaim) : null;
}

export interface ListClaimsFilter {
  status?: VerificationStatus;
  agentRef?: string;
  limit?: number;
}

export function listClaims(filter: ListClaimsFilter = {}): StoredClaim[] {
  const conditions: string[] = [];
  const params: Array<string | number> = [];
  if (filter.status) {
    conditions.push("status = ?");
    params.push(filter.status);
  }
  if (filter.agentRef) {
    conditions.push("agent_ref = ?");
    params.push(filter.agentRef);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);
  const rows = getDatabase()
    .prepare<Record<string, unknown>>(
      `SELECT * FROM claims ${where} ORDER BY submitted_at DESC LIMIT ${limit}`,
    )
    .all(...params);
  return rows.map((r: Record<string, unknown>) => claimRowToClaim(r) as StoredClaim);
}

export function saveAttestation(record: Omit<AttestationRecord, "id" | "attestedAt">): AttestationRecord {
  const db = getDatabase();
  const id = randomUUID().slice(0, 12);
  const attestedAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO attestations (id, claim_id, claim_hash, chain, tx_hash, block_number, attested_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, record.claimId, record.claimHash, record.chain, record.txHash, record.blockNumber, attestedAt);
  db.prepare(
    `UPDATE claims SET attestation_id = ?, tx_hash = ?, block_number = ? WHERE id = ?`,
  ).run(id, record.txHash, record.blockNumber, record.claimId);
  return { ...record, id, attestedAt };
}

export function getAttestationsForClaim(claimId: string): AttestationRecord[] {
  const rows = getDatabase()
    .prepare<Record<string, unknown>>("SELECT * FROM attestations WHERE claim_id = ?")
    .all(claimId);
  return rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    claimId: r.claim_id as string,
    claimHash: r.claim_hash as string,
    chain: r.chain as string,
    txHash: r.tx_hash as string,
    blockNumber: r.block_number as number,
    attestedAt: r.attested_at as string,
  }));
}

export interface UserDashboard {
  user: ReturnType<typeof getUser>;
  totalCredits: number;
  claimCount: number;
  verifiedCount: number;
  partialCount: number;
  flaggedCount: number;
  claims: StoredClaim[];
}

export function getUserDashboard(agentRef: string): UserDashboard | null {
  const user = getUser(agentRef);
  if (!user) return null;
  const claims = listClaims({ agentRef });
  const totalCredits = claims.reduce((s, c) => s + c.creditsAwarded, 0);
  return {
    user,
    totalCredits,
    claimCount: claims.length,
    verifiedCount: claims.filter((c) => c.status === "verified").length,
    partialCount: claims.filter((c) => c.status === "partial").length,
    flaggedCount: claims.filter((c) => c.status === "flagged").length,
    claims,
  };
}