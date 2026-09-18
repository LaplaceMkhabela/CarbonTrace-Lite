/**
 * Verification engine CLI.
 *
 *   npm run verify -- --type tree-planted --lat -26.2 --lon 28.05 --qty 40 --unit trees
 *
 * Runs a claim through the full verification pipeline and prints the result.
 */
import "dotenv/config";
import { verifyClaim } from "../src/verification/engine";
import { claimSchema, CLAIM_TYPE_LABELS } from "../src/types/claim";

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function usageAndExit(): never {
  console.error(
    [
      "usage: npm run verify -- --type <claimType> --lat <lat> --lon <lon> --qty <quantity> --unit <unit>",
      "claimTypes: " + CLAIM_TYPE_LABELS && Object.keys(CLAIM_TYPE_LABELS).join(", "),
      "example: npm run verify -- --type tree-planted --lat -26.2 --lon 28.05 --qty 40 --unit trees",
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
  const activityDate = arg("date");

  if (!type || !lat || !lon || !qty || !unit) usageAndExit();

  const input = {
    claimType: type,
    lat: Number(lat),
    lon: Number(lon),
    quantity: Number(qty),
    unit,
    activityDate,
  };

  const parsed = claimSchema.safeParse(input);
  if (!parsed.success) {
    console.error("Invalid claim:", parsed.error.flatten());
    process.exit(1);
  }

  const result = await verifyClaim(input);

  console.log("\n=== CarbonTrace Lite verification ===");
  console.log(`Claim id      : ${result.claimId}`);
  console.log(`Type          : ${CLAIM_TYPE_LABELS[result.claim.claimType]}`);
  console.log(`Location      : ${result.claim.lat}, ${result.claim.lon}`);
  console.log(`Quantity      : ${result.claim.quantity} ${result.claim.unit}`);
  console.log(`Confidence    : ${result.confidence}`);
  console.log(`Anomaly score : ${result.anomalyScore}`);
  console.log(`Status        : ${result.status}`);
  console.log(`Multiplier    : ${result.multiplier}`);
  console.log(`Credits       : ${result.creditsAwarded} CTC`);
  console.log(`Sources       : NDVI=${result.signals.provider.ndvi} NDWI=${result.signals.provider.ndwi} Weather=${result.signals.provider.weather}`);
  console.log("\nSignals:");
  for (const s of result.signalsBreakdown) {
    console.log(`  - [${s.name}] ${s.value.toFixed(2)} — ${s.reason}`);
  }
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});