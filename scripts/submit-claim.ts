/**
 * Submits a claim through the FULL pipeline:
 * verify → persist (repository) → attest (simulated by default, live chain
 * when POLYGON_RPC_URL + PRIVATE_KEY + CONTRACT_ADDRESS are set).
 *
 *   npm run submit -- --type tree-planted --lat -26.2 --lon 28.05 --qty 40 --unit trees --agent school@alpha
 */
import "dotenv/config";
import { submitClaim } from "../src/services/claim-service";
import { CLAIM_TYPE_LABELS } from "../src/types/claim";

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function usageAndExit(): never {
  console.error(
    [
      "usage: npm run submit -- --type <claimType> --lat <lat> --lon <lon> --qty <quantity> --unit <unit> [--agent <id>] [--date <iso>] [--note <text>]",
      "claimTypes: " + Object.keys(CLAIM_TYPE_LABELS).join(", "),
    ].join("\n"),
  );
  process.exit(1);
}

async function main() {
  const type = arg("type");
  const lat = arg("lat");
  const lon = arg("lon");
  const qty = arg("qty");
  const unit = arg("unit");
  if (!type || !lat || !lon || !qty || !unit) usageAndExit();

  const agentRef = arg("agent");
  const activityDate = arg("date");

  const input = {
    claimType: type,
    lat: Number(lat),
    lon: Number(lon),
    quantity: Number(qty),
    unit,
    activityDate,
  };

  const { record, verification, attestation, ownerId } = await submitClaim(input, {
    agentRef,
    note: arg("note"),
  });

  console.log("\n=== CarbonTrace Lite — claim submitted ===");
  console.log(`Claim         : ${verification.claimId} (${CLAIM_TYPE_LABELS[verification.claim.claimType as keyof typeof CLAIM_TYPE_LABELS] ?? verification.claim.claimType})`);
  console.log(`Agent         : ${agentRef ?? "anonymous"} → ${ownerId}`);
  console.log(`Confidence    : ${verification.confidence}`);
  console.log(`Status        : ${verification.status}`);
  console.log(`Credits       : ${verification.creditsAwarded} CTC`);
  console.log("");
  console.log("On-chain attestation:");
  console.log(`  Data hash    : ${attestation.dataHash}`);
  console.log(`  Fingerprint  : ${attestation.claimFingerprint}`);
  console.log(`  Network      : ${attestation.network}`);
  console.log(`  Contract     : ${attestation.contract}`);
  console.log(`  Tx hash      : ${attestation.txHash}`);
  console.log(`  Attested at  : ${attestation.attestedAt}`);
  console.log("");
  console.log(`Stored. Verify with: GET /api/claims/${record.result.claimId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
