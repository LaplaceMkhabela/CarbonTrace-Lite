import "dotenv/config";
import type { LedgerClient } from "./types";
import { SimulatedChainClient } from "./simulated";
import { EvmChainClient } from "./evm";

/**
 * Builds the active ledger client.
 *
 * Live (Polygon Amoy) when POLYGON_RPC_URL + PRIVATE_KEY + CONTRACT_ADDRESS
 * are all set, unless USE_LIVE_CHAIN=false explicitly forces offline mode.
 * Otherwise returns the offline simulated attestation client (no keys).
 *
 * This predicate is shared with `attestationMode()` in
 * src/onchain/attestation.ts so the reported mode can never disagree with
 * the client that actually attests.
 */
export function liveChainConfigured(): boolean {
  if ((process.env.USE_LIVE_CHAIN ?? "").toLowerCase() === "false") return false;
  return Boolean(
    process.env.POLYGON_RPC_URL &&
      process.env.PRIVATE_KEY &&
      process.env.CONTRACT_ADDRESS,
  );
}

export function buildLedgerClient(): LedgerClient {
  if (!liveChainConfigured()) return new SimulatedChainClient();

  const rpcUrl = process.env.POLYGON_RPC_URL!;
  const privateKey = process.env.PRIVATE_KEY!;
  return new EvmChainClient({
    rpcUrl,
    privateKey,
    contractAddress: process.env.CONTRACT_ADDRESS || undefined,
  });
}