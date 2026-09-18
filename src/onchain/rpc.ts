import "dotenv/config";

/**
 * Minimal read-only JSON-RPC client for the Polygon Amoy testnet.
 *
 * Dependency-free (uses global fetch). Used for connectivity checks and
 * reading on-chain state. Writes (deploy / attestClaim) still require a real
 * signer — see scripts/deploy-contract.ts.
 */

export interface RpcResult<T> {
  ok: boolean;
  error?: string;
  value?: T;
}

async function call<T>(method: string, params: unknown[]): Promise<RpcResult<T>> {
  const url = process.env.POLYGON_RPC_URL;
  if (!url) return { ok: false, error: "POLYGON_RPC_URL not configured" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const json = (await res.json()) as { error?: { message?: string }; result?: T };
    if (json.error) return { ok: false, error: json.error.message };
    return { ok: true, value: json.result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "RPC call failed" };
  }
}

export interface ChainInfo {
  chainId: string;
  blockNumber: string;
  contractCodePresent: boolean;
}

/** Chain id, latest block and whether the configured contract is deployed. */
export async function getChainInfo(): Promise<RpcResult<ChainInfo>> {
  const [chainId, blockNumber, code] = await Promise.all([
    call<string>("eth_chainId", []),
    call<string>("eth_blockNumber", []),
    call<string>("eth_getCode", [process.env.CONTRACT_ADDRESS ?? "", "latest"]),
  ]);
  if (!chainId.ok || !chainId.value) return { ok: false, error: chainId.error ?? "no chainId" };

  const contractAddress = process.env.CONTRACT_ADDRESS ?? "";
  const codeHex = code.value ?? "0x";
  return {
    ok: true,
    value: {
      chainId: chainId.value,
      blockNumber: blockNumber.value ?? "unknown",
      contractCodePresent: Boolean(contractAddress) && codeHex !== "0x" && codeHex.length > 2,
    },
  };
}

export { call };