/**
 * Trains the anomaly-detection MLP and persists it to
 * data/models/anomaly-model.json.
 *
 *   npm run train
 */
import fs from "node:fs";
import path from "node:path";
import { generateDataset, toFeatureMatrix } from "../src/verification/synthetic-data";
import { trainANN } from "../src/verification/ann";
import { FEATURE_NAMES } from "../src/verification/features";

const OUT_DIR = path.join(process.cwd(), "data", "models");
const OUT_FILE = path.join(OUT_DIR, "anomaly-model.json");

function main() {
  const seed = Number(process.env.TRAIN_SEED ?? 1337);
  const dataset = generateDataset({ perType: 300, seed });
  const X = toFeatureMatrix(dataset.features);
  const y = dataset.labels;

  const { model, metrics } = trainANN(X, y, {
    hidden: Number(process.env.HIDDEN ?? 12),
    epochs: Number(process.env.EPOCHS ?? 150),
    seed,
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(model));

  console.log(`Trained anomaly-detection MLP → ${OUT_FILE}`);
  console.log(`  samples       : ${X.length} (legit ${dataset.byType["tree-planted"].plausible * 5} / anomalous ${dataset.byType["tree-planted"].anomalous * 5})`);
  console.log(`  architecture  : ${model.inputDim} → ${model.hidden} → 1`);
  console.log(`  features      : ${FEATURE_NAMES.join(", ")}`);
  console.log(`  epochs        : ${numEpochs()}`);
  console.log("");
  console.log(`  accuracy      : ${(metrics.accuracy * 100).toFixed(1)}%`);
  console.log(`  precision     : ${(metrics.precision * 100).toFixed(1)}%`);
  console.log(`  recall        : ${(metrics.recall * 100).toFixed(1)}%`);
  console.log(`  FP            : ${metrics.fp}`);
  console.log(`  FN            : ${metrics.fn}`);
}

function numEpochs(): number {
  return Number(process.env.EPOCHS ?? 150);
}

main();