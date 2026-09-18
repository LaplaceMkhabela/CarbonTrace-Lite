import "dotenv/config";
import type { VerificationResult } from "@/types/claim";
import { fingerprint, hashVerification } from "./hash";
import { buildLedgerClient, liveChainConfigured } from "@/chain";
import type { Attestation } from "@/storage/types";

/**
 * On-chain attestation for a verification result.
 *
 * Attestations are produced by the active ledger client:
 *  - Offline (default, no keys): the deterministic simulated ledger returns a
 *    keccak claim hash plus a pseudo-tx, and the `dataHash` is the canonical
 *    SHA-256 verification digest. Same inputs → same outputs, so demos and CI
 *    are reproducible with zero configuration.
 *  - Live (PRIVATE_KEY + CONTRACT_ADDRESS + POLYGON_RPC_URL set): the EVM
 *    client submits a real `CarbonTraceCredits.mint()` transaction on Polygon
 *    Amoy and the returned tx hash/attestation is the on-chain proof.
 *
 * In both modes a verbatim copy of what was attested can be reproduced offline
 * via `hashVerification(result)` — that is the point: the hash you see in the
 * demo is the hash that can be verified on-chain.
 */

export type AttestationMode = "simulated" | "live";

export function attestationMode(): AttestationMode {
  // Single source of truth shared with buildLedgerClient() so the reported
  // mode can never disagree with the client that actually attests.
  return liveChainConfigured() ? "live" : "simulated";
}

export async function attestResult(result: VerificationResult): Promise<Attestation> {
  const mode = attestationMode();
  const dataHash = hashVerification(result);
  const attestedAt = new Date().toISOString();
  const ledger = buildLedgerClient();

  // The canonical claim hash is what the ledger records; the SHA-256 dataHash
  // above is the reproducible check-value exposed to the app/certificates.
  const receipt = await ledger.attest(
    {
      claimId: result.claimId,
      confidence: result.confidence,
      status: result.status,
      creditsAwarded: result.creditsAwarded,
      communityAddress: process.env.COMMUNITY_ADDRESS ?? "community",
    },
    process.env.COMMUNITY_ADDRESS,
  );

  return {
    dataHash,
    claimFingerprint: fingerprint(dataHash),
    network: mode === "live" ? `polygon-amoy@${receipt.chain}` : "polygon-amoy (simulated)",
    contract:
      ledger.contractAddress() ?? "CarbonTraceCredits (source in contracts/CarbonTraceCredits.sol)",
    txHash: receipt.txHash,
    confidence: result.confidence,
    attestedAt: receipt.attestedAt || attestedAt,
  };
}