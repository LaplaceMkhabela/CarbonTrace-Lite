import { keccak256, toUtf8Bytes } from "ethers";

/** A claim fingerprint attested on-chain. */
export interface ClaimAttestationInput {
  claimId: string;
  confidence: number;
  status: "verified" | "partial" | "flagged";
  creditsAwarded: number;
  communityAddress: string;
}

export const rankedStatus = { verified: 0, partial: 1, flagged: 2 } as const;

export interface AttestationReceipt {
  claimHash: string;
  chain: string;
  txHash: string;
  blockNumber: number;
  nonce: number;
  attestedAt: string;
}

/**
 * Canonical claim hash — what actually goes on-chain.
 */
export function computeClaimHash(input: ClaimAttestationInput): string {
  const canonical = JSON.stringify({
    claimId: input.claimId,
    confidence: Math.round(input.confidence * 1000) / 1000,
    status: input.status,
    credits: input.creditsAwarded,
  });
  return keccak256(toUtf8Bytes(canonical));
}

/** Ledger abstraction: EVM + offline simulated implementation. */
export interface LedgerClient {
  readonly chain: string;
  /** Attest (and, on EVM, mint) a verified claim. Returns the receipt. */
  attest(input: ClaimAttestationInput, mintsForAddress?: string): Promise<AttestationReceipt>;
  /** Current CTC balance of an account. */
  balanceOf(address: string): Promise<bigint>;
  /** On-chain contract address ('' when simulated). */
  contractAddress(): string | null;
}