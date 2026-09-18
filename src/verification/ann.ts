/**
 * A tiny neural network (MLP) written in pure TypeScript, used as the runtime
 * anomaly detector for CarbonTrace Lite.
 *
 * The network is trained offline (scripts/train-model.ts) on the labeled
 * synthetic dataset and persisted as JSON. At runtime the engine only performs
 * a forward pass over 7 features — fast enough for a serverless API call.
 */

export interface ANNModel {
  kind: "ann";
  inputDim: number;
  hidden: number;
  means: number[];
  stds: number[];
  W1: number[][]; // [hidden][inputDim]
  b1: number[]; // [hidden]
  W2: number[]; // [hidden]
  b2: number;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- inference ---------- */

export function predict(model: ANNModel, features: number[]): number {
  const x = Array.from({ length: model.inputDim }, (_, j) =>
    (features[j] - model.means[j]) / model.stds[j],
  );
  const h = Array.from({ length: model.hidden }, (_, j) => {
    let acc = model.b1[j];
    for (let i = 0; i < model.inputDim; i++) acc += model.W1[j][i] * x[i];
    return Math.tanh(acc);
  });
  let acc = model.b2;
  for (let j = 0; j < model.hidden; j++) acc += model.W2[j] * h[j];
  return sigmoid(acc);
}

/* ---------- training (Adam) ---------- */

export interface TrainOptions {
  hidden?: number;
  epochs?: number;
  learningRate?: number;
  batchSize?: number;
  seed?: number;
}

export function trainANN(
  X: number[][],
  y: number[],
  options: TrainOptions = {},
): { model: ANNModel; metrics: { accuracy: number; precision: number; recall: number; fp: number; fn: number } } {
  const inputDim = X[0].length;
  const hidden = options.hidden ?? 10;
  const epochs = options.epochs ?? 120;
  const learningRate = options.learningRate ?? 0.5;
  const batchSize = options.batchSize ?? 32;
  const seed = options.seed ?? 2026;
  const rand = mulberry32(seed);
  const beta1 = 0.9;
  const beta2 = 0.999;
  const eps = 1e-8;

  // Standardization.
  const means = Array.from({ length: inputDim }, (_, j) => X.reduce((s, r) => s + r[j], 0) / X.length);
  const stds = Array.from({ length: inputDim }, (_, j) => {
    const m = means[j];
    return Math.sqrt(X.reduce((s, r) => s + (r[j] - m) ** 2, 0) / X.length) || 1;
  });
  const Xz = X.map((row) => row.map((v, j) => (v - means[j]) / stds[j]));

  // Parameters.
  const W1 = Array.from({ length: hidden }, () =>
    Array.from({ length: inputDim }, () => ((rand() - 0.5) * 2) / Math.sqrt(inputDim)),
  );
  const b1 = new Array(hidden).fill(0);
  const W2 = Array.from({ length: hidden }, () => ((rand() - 0.5) * 2) / Math.sqrt(hidden));
  let b2 = 0;

  // Adam moments.
  const mW1 = W1.map((r) => r.map(() => 0));
  const vW1 = W1.map((r) => r.map(() => 0));
  const mb1 = new Array(hidden).fill(0);
  const vb1 = new Array(hidden).fill(0);
  const mW2 = new Array(hidden).fill(0);
  const vW2 = new Array(hidden).fill(0);
  let mb2 = 0;
  let vb2 = 0;

  const order = Xz.map((_, i) => i);

  for (let epoch = 0; epoch < epochs; epoch++) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    for (let b = 0; b < order.length; b += batchSize) {
      const batch = order.slice(b, b + batchSize);

      // Gradients over the batch.
      const gW1 = W1.map((r) => r.map(() => 0));
      const gb1 = new Array(hidden).fill(0);
      const gW2 = new Array(hidden).fill(0);
      let gb2 = 0;

      for (const idx of batch) {
        const x = Xz[idx];
        const target = y[idx];

        const pre = new Array(hidden);
        const h = new Array(hidden);
        for (let j = 0; j < hidden; j++) {
          let acc = b1[j];
          for (let i = 0; i < inputDim; i++) acc += W1[j][i] * x[i];
          pre[j] = acc;
          h[j] = Math.tanh(acc);
        }
        let outPre = b2;
        for (let j = 0; j < hidden; j++) outPre += W2[j] * h[j];
        const out = sigmoid(outPre);

        const dOut = out - target; // cross-entropy gradient w.r.t. logit
        for (let j = 0; j < hidden; j++) {
          const dh = dOut * W2[j] * (1 - h[j] * h[j]);
          gW2[j] += dOut * h[j];
          gb2 += dOut;
          gb1[j] += dh;
          for (let i = 0; i < inputDim; i++) gW1[j][i] += dh * x[i];
        }
      }

      // Adam update.
      const step = (t: number, g: number, m: number, v: number) =>
        learningRate * (m / (1 - beta1 ** t)) / (Math.sqrt(v / (1 - beta2 ** t)) + eps);

      for (let j = 0; j < hidden; j++) {
        for (let i = 0; i < inputDim; i++) {
          const g = gW1[j][i] / batch.length;
          mW1[j][i] = beta1 * mW1[j][i] + (1 - beta1) * g;
          vW1[j][i] = beta2 * vW1[j][i] + (1 - beta2) * g * g;
          W1[j][i] -= step(epoch + 1, g, mW1[j][i], vW1[j][i]);
        }
        const gb = gb1[j] / batch.length;
        mb1[j] = beta1 * mb1[j] + (1 - beta1) * gb;
        vb1[j] = beta2 * vb1[j] + (1 - beta2) * gb * gb;
        b1[j] -= step(epoch + 1, gb, mb1[j], vb1[j]);

        const gw2 = gW2[j] / batch.length;
        mW2[j] = beta1 * mW2[j] + (1 - beta1) * gw2;
        vW2[j] = beta2 * vW2[j] + (1 - beta2) * gw2 * gw2;
        W2[j] -= step(epoch + 1, gw2, mW2[j], vW2[j]);
      }
      const gb2v = gb2 / batch.length;
      mb2 = beta1 * mb2 + (1 - beta1) * gb2v;
      vb2 = beta2 * vb2 + (1 - beta2) * gb2v * gb2v;
      b2 -= step(epoch + 1, gb2v, mb2, vb2);
    }
  }

  const model: ANNModel = { kind: "ann", inputDim, hidden, means, stds, W1, b1, W2, b2 };

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (let i = 0; i < Xz.length; i++) {
    const p = predict(model, X[i]) >= 0.5 ? 1 : 0;
    if (p === 1 && y[i] === 1) tp++;
    else if (p === 1 && y[i] === 0) fp++;
    else if (p === 0 && y[i] === 0) tn++;
    else fn++;
  }

  return {
    model,
    metrics: {
      accuracy: (tp + tn) / X.length,
      precision: tp / Math.max(1, tp + fp),
      recall: tp / Math.max(1, tp + fn),
      fp,
      fn,
    },
  };
}