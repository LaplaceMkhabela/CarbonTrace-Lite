import type { Credit, User, VerificationResult } from "@/types/claim";

/**
 * Storage contracts for CarbonTrace Lite.
 *
 * The repository interface is intentionally small so the default JSON-file
 * implementation (src/storage/json-file.ts) can be swapped for SQLite or
 * Postgres behind the same API without touching the rest of the system.
 */

export interface Attestation {
  /** Canonical claim hash that is written to the ledger. */
  dataHash: string;
  /** Truncated dataHash, human-readable — shown on certificates. */
  claimFingerprint: string;
  /** Network the attestation was written to. */
  network: string;
  /** Contract address (0x…) or "simulated" when running offline. */
  contract: string;
  /** Transaction/ledger id. Simulated in offline mode. */
  txHash: string;
  /** Verification confidence snapshot at attestation time. */
  confidence: number;
  /** Attestation timestamp (ISO). */
  attestedAt: string;
}

export interface ClaimRecord {
  result: VerificationResult;
  attestation: Attestation | null;
  savedAt: string;
}

export interface Repository {
  /** Persist a verification result (and its attestation if provided). */
  saveClaim(record: ClaimRecord): Promise<void>;
  getClaim(claimId: string): Promise<ClaimRecord | null>;
  /** Most-recent-first. */
  listClaims(limit?: number, offset?: number, claimType?: string): Promise<ClaimRecord[]>;
  countClaims(): Promise<number>;

  /** Upsert a user. */
  saveUser(user: User): Promise<void>;
  getUser(userId: string): Promise<User | null>;

  /** Credit ledger. */
  recordCredit(credit: Credit): Promise<void>;
  listCreditsByUser(userId: string): Promise<Credit[]>;

  /** Community-level stats (for maps / dashboards). */
  getStats(): Promise<{
    totalClaims: number;
    verifiedClaims: number;
    flaggedClaims: number;
    totalCreditsAwarded: number;
  }>;
}