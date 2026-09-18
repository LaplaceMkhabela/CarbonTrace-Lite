import fs from "node:fs";
import path from "node:path";
import type { Credit, User, VerificationResult } from "@/types/claim";
import type { Attestation, ClaimRecord, Repository } from "./types";

/**
 * Default repository: a small JSON-file store with atomic writes.
 *
 * Chosen so CarbonTrace Lite runs with literally zero configuration — data
 * lives in <project>/data/store/. Everything sits behind the Repository
 * interface, so swapping to SQLite/Postgres later only changes this file.
 */

type ClaimMap = Record<string, ClaimRecord>;
type UserMap = Record<string, User>;

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown): void {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

const DEFAULT_DATA_DIR = path.join(process.cwd(), "data", "store");

export class JsonFileRepository implements Repository {
  constructor(private readonly dataDir: string = DEFAULT_DATA_DIR) {}

  private file(name: string): string {
    return path.join(this.dataDir, name);
  }

  private readClaims(): ClaimMap {
    return readJson<ClaimMap>(this.file("claims.json"), {});
  }

  private readUsers(): UserMap {
    return readJson<UserMap>(this.file("users.json"), {});
  }

  private readCredits(): Credit[] {
    return readJson<Credit[]>(this.file("credits.json"), []);
  }

  async saveClaim(record: ClaimRecord): Promise<void> {
    const claims = this.readClaims();
    claims[record.result.claimId] = record;
    writeJson(this.file("claims.json"), claims);
  }

  async getClaim(claimId: string): Promise<ClaimRecord | null> {
    return this.readClaims()[claimId] ?? null;
  }

  async listClaims(limit = 50, offset = 0, claimType?: string): Promise<ClaimRecord[]> {
    const claims = Object.values(this.readClaims()).sort((a, b) =>
      b.result.createdAt.localeCompare(a.result.createdAt),
    );
    const filtered = claimType ? claims.filter((c) => c.result.claim.claimType === claimType) : claims;
    return filtered.slice(offset, offset + limit);
  }

  async countClaims(): Promise<number> {
    return Object.keys(this.readClaims()).length;
  }

  async saveUser(user: User): Promise<void> {
    const users = this.readUsers();
    users[user.id] = user;
    writeJson(this.file("users.json"), users);
  }

  async getUser(userId: string): Promise<User | null> {
    return this.readUsers()[userId] ?? null;
  }

  async recordCredit(credit: Credit): Promise<void> {
    if (credit.amount <= 0) return;
    const credits = this.readCredits();
    credits.push(credit);
    writeJson(this.file("credits.json"), credits);

    // Keep the owner's balance in sync.
    const users = this.readUsers();
    if (users[credit.ownerRef]) {
      users[credit.ownerRef] = {
        ...users[credit.ownerRef],
        creditBalance: users[credit.ownerRef].creditBalance + credit.amount,
      };
      writeJson(this.file("users.json"), users);
    }
  }

  async listCreditsByUser(userId: string): Promise<Credit[]> {
    return this.readCredits().filter((c) => c.ownerRef === userId).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async getStats(): Promise<{
    totalClaims: number;
    verifiedClaims: number;
    flaggedClaims: number;
    totalCreditsAwarded: number;
  }> {
    const claims = Object.values(this.readClaims());
    const credits = this.readCredits();
    return {
      totalClaims: claims.length,
      verifiedClaims: claims.filter((c) => c.result.status === "verified").length,
      flaggedClaims: claims.filter((c) => c.result.status === "flagged").length,
      totalCreditsAwarded: credits.reduce((s, c) => s + c.amount, 0),
    };
  }
}

export const jsonFileRepository = new JsonFileRepository();

export type { Attestation, ClaimRecord, VerificationResult };