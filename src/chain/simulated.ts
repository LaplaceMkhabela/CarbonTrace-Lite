import { randomUUID } from "node:crypto";
import {
  computeClaimHash,
  type AttestationReceipt,
  type ClaimAttestationInput,
  type LedgerClient,
} from "./types";

/**
 * Offline ledger client — the default for demos and CI.
 *
 * Produces deterministic, "looks like a chain" receipts without any network or
 * keys, so the whole claim → attest pipeline is testable in seconds. The
 * receipts still carry a keccak claim hash, a pseudo-tx hash and a block number.
 */
export class SimulatedChainClient implements LedgerClient {
  readonly chain = "simulated";

  private counter = 0;

  constructor(private account = "0x0000000000000000000000000000000000000001") {}

  contractAddress(): string | null {
    return "0x0000000000000000000000000000000000000000";
  }

  async balanceOf(address: string): Promise<bigint> {
    // Simulated credits are static notes; balances are aggregated off-chain.
    void address;
    return 0n;
  }

  async attest(input: ClaimAttestationInput): Promise<AttestationReceipt> {
    this.counter += 1;
    const claimHash = computeClaimHash(input);
    const txHash =
      "0x" + randomUUID().replaceAll("-", "") + (this.counter % 16).toString(16).padStart(2, "0");
    return {
      claimHash,
      chain: this.chain,
      txHash,
      blockNumber: 57_000_000 + this.counter,
      nonce: this.counter,
      attestedAt: new Date().toISOString(),
    };
  }
}