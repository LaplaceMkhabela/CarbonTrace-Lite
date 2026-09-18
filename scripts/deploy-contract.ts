/**
 * Deployment helper for the CarbonTraceCredits contract.
 *
 *   npm run deploy
 *
 * This project deliberately ships without a signing dependency, so deployment
 * is a guided two-step:
 *   1. This script validates env + RPC connectivity + whether an existing
 *      contract (CONTRACT_ADDRESS) is live.
 *   2. Deploy the contract with your own tooling (Hardhat / Remix / Cast) —
 *      compile contracts/CarbonTraceCredits.sol, target Polygon Amoy, then set
 *      CONTRACT_ADDRESS.
 */
import "dotenv/config";
import { getRepository } from "../src/storage";
import { getChainInfo } from "../src/onchain/rpc";
import { attestationMode } from "../src/onchain/attestation";

async function main() {
  const mode = attestationMode();
  console.log(`\n=== CarbonTraceCredits deployment helper ===`);
  console.log(`attestation mode : ${mode}${mode === "simulated" ? " (no PRIVATE_KEY/CONTRACT_ADDRESS set)" : ""}`);

  const chain = await getChainInfo();
  if (chain.ok && chain.value) {
    const dec = Number.parseInt(chain.value.chainId, 16);
    console.log(`RPC reachable     : yes`);
    console.log(`chain id          : ${dec} (${chain.value.chainId})`);
    console.log(`latest block      : ${Number.parseInt(chain.value.blockNumber, 16)}`);
    console.log(
      `contract deployed : ${chain.value.contractCodePresent ? "yes" : "no / not set"}` +
        ` (checking ${process.env.CONTRACT_ADDRESS ?? "(none configured)"})`,
    );
  } else {
    console.log(`RPC reachable     : no (${chain.error ?? "no URL"}). Demo mode is fully functional.`);
  }

  const repo = getRepository();
  const stats = await repo.getStats();
  console.log(`\nstored records    : ${stats.totalClaims} claims · ${stats.totalCreditsAwarded} CTC awarded`);

  console.log(`
To go live:
  RPC endpoint   : ${process.env.POLYGON_RPC_URL || "missing (set POLYGON_RPC_URL)"}
  Private key    : ${process.env.PRIVATE_KEY ? "set" : "missing  (set PRIVATE_KEY for attest signing)"}
  Contract       : ${process.env.CONTRACT_ADDRESS ? "set: " + process.env.CONTRACT_ADDRESS : "missing  (deploy CarbonTraceCredits.sol, then set CONTRACT_ADDRESS)"}

  1. Compile:        npm run compile (writes contracts/out/CarbonTraceCredits.json)
  2. Deploy to Polygon Amoy, capture the address, export CONTRACT_ADDRESS=<addr>.
  3. Restart the server: attestations now reference the live contract.
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});