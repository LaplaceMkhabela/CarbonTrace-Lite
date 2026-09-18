/**
 * A dependency-free Isolation Forest implementation in TypeScript.
 *
 * Used to score new claims for anomalousness: claims whose feature vector is
 * "easy to isolate" (short average path length through the forest) score close
 * to 1. Only the training script needs randomness — scoring is deterministic.
 */

export type ForestNode =
  | { kind: "leaf"; size: number }
  | { kind: "branch"; feature: number; threshold: number; left: ForestNode; right: ForestNode };

export interface IsolationTree {
  root: ForestNode;
}

export interface IsolationForestModel {
  kind: "isolation-forest";
  numTrees: number;
  sampleSize: number;
  maxDepth: number;
  numFeatures: number;
  trees: IsolationTree[];
  /** Average path length over the training set, used to recentre scores at 0.5. */
  baselinePathLength: number;
}

type Prng = () => number;

/** mulberry32 PRNG (seeded). */
function mulberry32(seed: number): Prng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EULER_MASCHERONI = 0.5772156649015328606;

function harmonicNumber(n: number): number {
  if (n <= 0) return 0;
  return Math.log(n) + EULER_MASCHERONI;
}

/** Average path length for an unsuccessful search in a BST of n points. */
export function averagePathLength(n: number): number {
  if (n <= 1) return 0;
  return 2 * harmonicNumber(n - 1) - (2 * (n - 1)) / n;
}

function buildTree(
  samples: number[][],
  depth: number,
  maxDepth: number,
  rand: Prng,
): ForestNode {
  const size = samples.length;
  if (depth >= maxDepth || size <= 1) return { kind: "leaf", size };

  const feature = Math.floor(rand() * samples[0].length);
  const values = samples.map((s) => s[feature]);
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (max - min < 1e-9) return { kind: "leaf", size };

  const threshold = min + rand() * (max - min);
  const left: number[][] = [];
  const right: number[][] = [];
  for (const s of samples) {
    if (s[feature] <= threshold) left.push(s);
    else right.push(s);
  }
  // Degenerate split (e.g. all values equal to threshold) → stop.
  if (left.length === 0 || right.length === 0) return { kind: "leaf", size };

  return {
    kind: "branch",
    feature,
    threshold,
    left: buildTree(left, depth + 1, maxDepth, rand),
    right: buildTree(right, depth + 1, maxDepth, rand),
  };
}

/** Path length of a single sample through one tree. */
function pathLength(node: ForestNode, sample: number[], depth: number): number {
  if (node.kind === "leaf") {
    return depth + averagePathLength(node.size);
  }
  if (sample[node.feature] <= node.threshold) {
    return pathLength(node.left, sample, depth + 1);
  }
  return pathLength(node.right, sample, depth + 1);
}

export interface FitOptions {
  numTrees?: number;
  sampleSize?: number;
  seed?: number;
}

/**
 * Fit an isolation forest on the given feature matrix.
 * Examples: rows are claims, columns are feature values (0..1 scale recommended).
 */
export function fitIsolationForest(
  samples: number[][],
  options: FitOptions = {},
): IsolationForestModel {
  const numTrees = options.numTrees ?? 100;
  const sampleSize = Math.min(options.sampleSize ?? 256, samples.length);
  const maxDepth = Math.ceil(Math.log2(Math.max(2, sampleSize)));
  const rand = mulberry32(options.seed ?? 42);
  const numFeatures = samples[0]?.length ?? 0;

  const trees: IsolationTree[] = [];
  for (let i = 0; i < numTrees; i++) {
    const pool: number[][] = [];
    while (pool.length < sampleSize) {
      const idx = Math.floor(rand() * samples.length);
      pool.push(samples[idx]);
    }
    trees.push({ root: buildTree(pool, 0, maxDepth, rand) });
  }

  // Empirical normalisation constant: the average path length over the training
  // set. Connecting to the classic c(ψ) would recentre scores at 0.5 even when
  // informative splits make isolation systematically faster than the theory.
  const baselinePathLength =
    samples.reduce((sum, s) => sum + trees.reduce((acc, t) => acc + pathLength(t.root, s, 0), 0) / trees.length, 0) /
    Math.max(1, samples.length);

  return { kind: "isolation-forest", numTrees, sampleSize, maxDepth, numFeatures, trees, baselinePathLength };
}

/**
 * Anomaly score in [0, 1]; 1 = most anomalous, 0.5 = neutral.
 */
export function anomalyScore(model: IsolationForestModel, sample: number[]): number {
  const expectedPath = model.trees.reduce((sum, tree) => sum + pathLength(tree.root, sample, 0), 0) /
    model.trees.length;
  const normalization = model.baselinePathLength > 0 ? model.baselinePathLength : averagePathLength(model.sampleSize);
  if (normalization <= 0) return 0.5;
  return Math.pow(2, -expectedPath / normalization);
}