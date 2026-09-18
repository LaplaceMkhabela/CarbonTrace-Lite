import type { Credit, User, VerificationResult } from "@/types/claim";
import { verifyClaim } from "@/verification/engine";
import { attestResult } from "@/onchain/attestation";
import { getRepository } from "@/storage";
import type { Attestation, ClaimRecord } from "@/storage/types";
import { normalizeAgentId } from "@/lib/agent";

// Legacy synchronous reads over the same SQLite file, kept for backwards
// compatibility. New code should use the async `Repository` (getRepository())
// instead — it is the canonical persistence path used by the API routes,
// the CLI and `submitClaim` below.
export { getClaim, listClaims, getUserDashboard } from "@/db/repository";
export type { StoredClaim, ListClaimsFilter } from "@/db/repository";

/**
 * Claim service — the orchestrator for the full pipeline:
 *   submit → verify (engine) → persist (repository) → attest (ledger).
 *
 * This is the canonical write path shared by `POST /api/verify` and the
 * `npm run submit` CLI. Owner ids are normalised with `normalizeAgentId`
 * and bound into the claim *before* verification so the resolved owner is
 * part of the attested hash — exactly like the API route does.
 */

export interface SubmitOptions {
  agentRef?: string;
  note?: string;
  communityAddress?: string;
  /** Forwarded to the verification engine (default: use the trained model). */
  useModel?: boolean;
}

export interface SubmittedClaim {
  record: ClaimRecord;
  verification: VerificationResult;
  attestation: Attestation;
  ownerId: string;
}

function friendlyName(agentRef?: string): string {
  const ref = (agentRef ?? "").trim();
  return ref ? ref : "Community pool";
}

export async function submitClaim(
  input: unknown,
  options: SubmitOptions = {},
): Promise<SubmittedClaim> {
  const repo = getRepository();
  const ownerId = normalizeAgentId(options.agentRef);

  // Persist the user (agent) before attesting.
  const existing = await repo.getUser(ownerId);
  if (!existing) {
    const user: User = {
      id: ownerId,
      displayName: friendlyName(options.agentRef),
      creditBalance: 0,
      createdAt: new Date().toISOString(),
    };
    await repo.saveUser(user);
  }

  // Bind the resolved owner (and note) into the claim before hashing /
  // verification so the attested result commits to the owner id.
  const raw = (input ?? {}) as Record<string, unknown>;
  const claimInput = {
    ...raw,
    agentRef: ownerId,
    note: options.note ?? raw.note,
  };
  const result = await verifyClaim(claimInput, { useModel: options.useModel });

  // Attest: hash the verified outcome on-chain. Only verified + partial
  // claims mint credits; flagged ones are attested for the audit trail
  // with 0 credits. An explicit per-call community address overrides the
  // COMMUNITY_ADDRESS env for this attestation only.
  const prevCommunity = process.env.COMMUNITY_ADDRESS;
  if (options.communityAddress) process.env.COMMUNITY_ADDRESS = options.communityAddress;
  let attestation: Attestation;
  try {
    attestation = await attestResult(result);
  } finally {
    if (options.communityAddress) {
      if (prevCommunity === undefined) delete process.env.COMMUNITY_ADDRESS;
      else process.env.COMMUNITY_ADDRESS = prevCommunity;
    }
  }

  const record: ClaimRecord = {
    result,
    attestation,
    savedAt: new Date().toISOString(),
  };
  await repo.saveClaim(record);

  // Award credits to the ledger when the claim earned any.
  if (result.creditsAwarded > 0) {
    const credit: Credit = {
      id: `credit:${result.claimId}`,
      claimId: result.claimId,
      ownerRef: ownerId,
      amount: result.creditsAwarded,
      confidence: result.confidence,
      status: result.status,
      createdAt: result.createdAt,
      attestationTxHash: attestation.txHash,
    };
    await repo.recordCredit(credit);
  }

  return { record, verification: result, attestation, ownerId };
}
