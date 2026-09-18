import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

// Loaded via createRequire so bundlers/Vite never try to resolve the Node
// builtin as a package (it is unflagged in Node 23.4+).
const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");

/**
 * SQLite database access (via Node's built-in node:sqlite).
 *
 * The database file lives at data/carbontrace.db (gitignored). Tables are
 * created idempotently on first use so the project works out of the box.
 */

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "carbontrace.db");

type Database = InstanceType<typeof DatabaseSync>;

let db: Database | null = null;

export function getDatabase(): Database {
  if (db) return db;

  const dbPath = process.env.DB_PATH || DEFAULT_DB_PATH;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

export function resetDatabase(): void {
  db?.close();
  db = null;
}

function migrate(database: Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      display_name  TEXT NOT NULL,
      location_label TEXT
    );

    CREATE TABLE IF NOT EXISTS claims (
      id              TEXT PRIMARY KEY,
      claim_type      TEXT NOT NULL,
      lat             REAL NOT NULL,
      lon             REAL NOT NULL,
      quantity        REAL NOT NULL,
      unit            TEXT NOT NULL,
      activity_date   TEXT,
      agent_ref       TEXT REFERENCES users(id),
      note            TEXT,
      confidence      REAL NOT NULL,
      anomaly_score   REAL NOT NULL,
      status          TEXT NOT NULL,
      multiplier      REAL NOT NULL,
      credits_awarded REAL NOT NULL,
      claim_hash      TEXT NOT NULL,
      signals_json    TEXT NOT NULL,
      signals_raw_json TEXT NOT NULL,
      breakdown_json  TEXT NOT NULL,
      submitted_at    TEXT NOT NULL,
      attestation_id  TEXT,
      tx_hash         TEXT,
      block_number    INTEGER
    );

    CREATE TABLE IF NOT EXISTS attestations (
      id            TEXT PRIMARY KEY,
      claim_id      TEXT REFERENCES claims(id),
      claim_hash    TEXT NOT NULL,
      chain         TEXT NOT NULL DEFAULT 'simulated',
      tx_hash       TEXT NOT NULL,
      block_number  INTEGER NOT NULL,
      attested_at   TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_claims_agent ON claims(agent_ref);
    CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
    CREATE INDEX IF NOT EXISTS idx_attest_claim ON attestations(claim_id);
  `);
}

export function userRowToUser(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    displayName: row.display_name as string,
    locationLabel: (row.location_label as string | null) ?? undefined,
  };
}

export function claimRowToClaim(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    claimType: row.claim_type as string,
    lat: row.lat as number,
    lon: row.lon as number,
    quantity: row.quantity as number,
    unit: row.unit as string,
    activityDate: (row.activity_date as string | null) ?? undefined,
    agentRef: (row.agent_ref as string | null) ?? undefined,
    note: (row.note as string | null) ?? undefined,
    confidence: row.confidence as number,
    anomalyScore: row.anomaly_score as number,
    status: row.status as "verified" | "partial" | "flagged",
    multiplier: row.multiplier as number,
    creditsAwarded: row.credits_awarded as number,
    claimHash: row.claim_hash as string,
    signals: JSON.parse(row.signals_json as string),
    signalsRaw: JSON.parse(row.signals_raw_json as string),
    signalsBreakdown: JSON.parse(row.breakdown_json as string),
    submittedAt: row.submitted_at as string,
    attestation: {
      id: (row.attestation_id as string | null) ?? null,
      txHash: (row.tx_hash as string | null) ?? null,
      blockNumber: (row.block_number as number | null) ?? null,
    },
  };
}