import { getDatabase, claimRowToClaim } from "@/db/database";
import { upsertUser, getUser as sqlGetUser } from "@/db/repository";
import { fingerprint } from "@/onchain/hash";
import type { Credit, User, VerificationResult } from "@/types/claim";
import type { Attestation, ClaimRecord, Repository } from "./types";

/**
 * Repository backed by SQLite (Node's built-in `node:sqlite`, no native deps).
 *
 * Complements the lower-level src/db/* helpers with the exact Repository
 * contract used by the rest of the app (routes, tests, CLI). The SQLite schema
 * from src/db/database.ts is extended idempotently with a credits ledger and
 * per-user balance.
 */

function ensureExtendedSchema(): void {
  const db = getDatabase();
  const cols = new Set(
    (db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>).map((c) => c.name),
  );
  if (!cols.has("credit_balance")) db.exec("ALTER TABLE users ADD COLUMN credit_balance REAL NOT NULL DEFAULT 0");
  if (!cols.has("created_at")) db.exec("ALTER TABLE users ADD COLUMN created_at TEXT");

  const aCols = new Set(
    (db.prepare("PRAGMA table_info(attestations)").all() as Array<{ name: string }>).map((c) => c.name),
  );
  if (!aCols.has("fingerprint")) db.exec("ALTER TABLE attestations ADD COLUMN fingerprint TEXT");
  if (!aCols.has("contract")) db.exec("ALTER TABLE attestations ADD COLUMN contract TEXT");
  if (!aCols.has("confidence")) db.exec("ALTER TABLE attestations ADD COLUMN confidence REAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS credits (
      id         TEXT PRIMARY KEY,
      claim_id   TEXT REFERENCES claims(id),
      owner_ref  TEXT NOT NULL,
      amount     REAL NOT NULL,
      confidence REAL NOT NULL,
      status     TEXT NOT NULL,
      created_at TEXT NOT NULL,
      attestation_tx_hash TEXT
    );
  `);
}

function rowToResult(row: Record<string, unknown>): VerificationResult {
  const c = claimRowToClaim(row);
  return {
    claimId: c.id,
    claim: {
      claimType: c.claimType as VerificationResult["claim"]["claimType"],
      lat: c.lat,
      lon: c.lon,
      quantity: c.quantity,
      unit: c.unit,
      activityDate: c.activityDate,
      agentRef: c.agentRef,
      note: c.note,
    },
    signals: c.signals as VerificationResult["signals"],
    signalsRaw: c.signalsRaw as VerificationResult["signalsRaw"],
    confidence: c.confidence,
    anomalyScore: c.anomalyScore,
    status: c.status,
    multiplier: c.multiplier,
    creditsAwarded: c.creditsAwarded,
    signalsBreakdown: c.signalsBreakdown as VerificationResult["signalsBreakdown"],
    createdAt: c.submittedAt,
  };
}

function rowToAttestation(row: Record<string, unknown>): Attestation {
  const chain = (row.chain as string) || "simulated";
  const txHash = (row.tx_hash as string) || "0x";
  return {
    dataHash: (row.claim_hash as string) || txHash.replace(/^0x/, ""),
    claimFingerprint: (row.fingerprint as string) || fingerprint((row.claim_hash as string) || ""),
    network: chain,
    contract: (row.contract as string) || "CarbonTraceCredits",
    txHash,
    confidence: (row.attestation_confidence as number) ?? 0,
    attestedAt: (row.attested_at as string) || "",
  };
}

function claimQuery(): string {
  return `
    SELECT c.*, a.id AS attestation_id, a.claim_hash, a.chain, a.tx_hash, a.block_number,
           a.attested_at, a.fingerprint, a.contract, a.confidence AS attestation_confidence
    FROM claims c
    LEFT JOIN attestations a ON a.claim_id = c.id
  `;
}

export class SqliteRepository implements Repository {
  constructor() {
    ensureExtendedSchema();
  }

  async saveClaim(record: ClaimRecord): Promise<void> {
    const db = getDatabase();
    const r = record.result;

    if (r.claim.agentRef && !sqlGetUser(r.claim.agentRef)) {
      upsertUser({ id: r.claim.agentRef, displayName: r.claim.agentRef });
    }

    const dataHash = record.attestation?.dataHash ?? r.claimId;
    db.prepare(
      `INSERT INTO claims (
         id, claim_type, lat, lon, quantity, unit, activity_date, agent_ref, note,
         confidence, anomaly_score, status, multiplier, credits_awarded, claim_hash,
         signals_json, signals_raw_json, breakdown_json, submitted_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         confidence=excluded.confidence, status=excluded.status,
         multiplier=excluded.multiplier, credits_awarded=excluded.credits_awarded,
         claim_hash=excluded.claim_hash`,
    ).run(
      r.claimId,
      r.claim.claimType,
      r.claim.lat,
      r.claim.lon,
      r.claim.quantity,
      r.claim.unit,
      r.claim.activityDate ?? null,
      r.claim.agentRef ?? null,
      r.claim.note ?? null,
      r.confidence,
      r.anomalyScore,
      r.status,
      r.multiplier,
      r.creditsAwarded,
      dataHash,
      JSON.stringify(r.signals),
      JSON.stringify(r.signalsRaw),
      JSON.stringify(r.signalsBreakdown),
      r.createdAt,
    );

    if (record.attestation) {
      const a = record.attestation;
      const existing = db
        .prepare("SELECT id FROM attestations WHERE claim_id = ?")
        .get(r.claimId) as { id: string } | undefined;
      if (!existing) {
        db.prepare(
          `INSERT INTO attestations (id, claim_id, claim_hash, chain, tx_hash, block_number, attested_at, fingerprint, contract, confidence)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          r.claimId,
          r.claimId,
          a.dataHash,
          a.network,
          a.txHash,
          0,
          a.attestedAt,
          a.claimFingerprint,
          a.contract,
          a.confidence,
        );
      }
    }
  }

  async getClaim(claimId: string): Promise<ClaimRecord | null> {
    const db = getDatabase();
    const row = db
      .prepare(`${claimQuery()} WHERE c.id = ?`)
      .get(claimId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      result: rowToResult(row),
      attestation: row.attestation_id ? rowToAttestation(row) : null,
      savedAt: (row.submitted_at as string) || "",
    };
  }

  async listClaims(limit = 50, offset = 0, claimType?: string): Promise<ClaimRecord[]> {
    const db = getDatabase();
    const rows = (
      claimType
        ? db.prepare(`${claimQuery()} WHERE c.claim_type = ? ORDER BY c.submitted_at DESC LIMIT ? OFFSET ?`).all(claimType, limit, offset)
        : db.prepare(`${claimQuery()} ORDER BY c.submitted_at DESC LIMIT ? OFFSET ?`).all(limit, offset)
    ) as unknown as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      result: rowToResult(row),
      attestation: row.attestation_id ? rowToAttestation(row) : null,
      savedAt: (row.submitted_at as string) || "",
    }));
  }

  async countClaims(): Promise<number> {
    const db = getDatabase();
    const row = db.prepare("SELECT COUNT(*) AS n FROM claims").get() as { n: number };
    return row?.n ?? 0;
  }

  async saveUser(user: User): Promise<void> {
    const db = getDatabase();
    const existing = sqlGetUser(user.id);
    if (existing) {
      // Never clobber a live credit balance on an upsert.
      db.prepare("UPDATE users SET display_name = ?, location_label = ?, created_at = COALESCE(created_at, ?) WHERE id = ?").run(
        user.displayName,
        user.locationLabel ?? null,
        user.createdAt,
        user.id,
      );
    } else {
      db.prepare(
        "INSERT INTO users (id, display_name, location_label, credit_balance, created_at) VALUES (?, ?, ?, ?, ?)",
      ).run(user.id, user.displayName, user.locationLabel ?? null, user.creditBalance, user.createdAt);
    }
  }

  async getUser(userId: string): Promise<User | null> {
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: row.id as string,
      displayName: (row.display_name as string) ?? row.id,
      locationLabel: (row.location_label as string | null) ?? undefined,
      creditBalance: (row.credit_balance as number) ?? 0,
      createdAt: (row.created_at as string) ?? "",
    };
  }

  async recordCredit(credit: Credit): Promise<void> {
    if (credit.amount <= 0) return;
    const db = getDatabase();
    ensureExtendedSchema();
    db.prepare(
      `INSERT INTO credits (id, claim_id, owner_ref, amount, confidence, status, created_at, attestation_tx_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      credit.id,
      credit.claimId,
      credit.ownerRef,
      credit.amount,
      credit.confidence,
      credit.status,
      credit.createdAt,
      credit.attestationTxHash ?? null,
    );
    const row = db.prepare("SELECT credit_balance FROM users WHERE id = ?").get(credit.ownerRef) as
      | { credit_balance: number }
      | undefined;
    const balance = (row?.credit_balance ?? 0) + credit.amount;
    db.prepare("UPDATE users SET credit_balance = ? WHERE id = ?").run(balance, credit.ownerRef);
  }

  async listCreditsByUser(userId: string): Promise<Credit[]> {
    const db = getDatabase();
    const rows = db
      .prepare("SELECT * FROM credits WHERE owner_ref = ? ORDER BY created_at DESC")
      .all(userId) as unknown as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: r.id as string,
      claimId: r.claim_id as string,
      ownerRef: r.owner_ref as string,
      amount: r.amount as number,
      confidence: r.confidence as number,
      status: r.status as Credit["status"],
      createdAt: r.created_at as string,
      attestationTxHash: (r.attestation_tx_hash as string | null) ?? undefined,
    }));
  }

  async getStats(): Promise<{
    totalClaims: number;
    verifiedClaims: number;
    flaggedClaims: number;
    totalCreditsAwarded: number;
  }> {
    const db = getDatabase();
    const c = db.prepare("SELECT COUNT(*) AS n FROM claims").get() as { n: number };
    const v = db.prepare("SELECT COUNT(*) AS n FROM claims WHERE status = 'verified'").get() as { n: number };
    const f = db.prepare("SELECT COUNT(*) AS n FROM claims WHERE status = 'flagged'").get() as { n: number };
    const s = db.prepare("SELECT COALESCE(SUM(amount), 0) AS s FROM credits").get() as { s: number };
    return {
      totalClaims: c?.n ?? 0,
      verifiedClaims: v?.n ?? 0,
      flaggedClaims: f?.n ?? 0,
      totalCreditsAwarded: s?.s ?? 0,
    };
  }
}

export const sqliteRepository = new SqliteRepository();