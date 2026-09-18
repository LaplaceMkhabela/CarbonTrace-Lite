import type { Claim, SignalSeries, SignalWeather } from "@/types/claim";
import type { DataFetcher } from "./types";

/**
 * Deterministic, key-free demo provider.
 *
 * Generates realistic-looking NDVI/NDWI/weather series from a seeded hash of
 * (lat, lon, date). Same inputs always produce the same outputs, so demos are
 * reproducible. This is also what lets judges run the project with no API keys.
 */

function hashString(input: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** mulberry32 PRNG seeded with an integer. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function climateCapacity(lat: number): number {
  const abs = Math.abs(lat);
  if (abs < 30) return 0.85;
  if (abs < 55) return 0.65;
  return 0.45;
}

function monthOf(claim: Claim): number {
  const d = claim.activityDate ? new Date(claim.activityDate) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth();
}

/** Base seasonal temperature norm for a latitude band, roughly the real annual mean. */
function seasonalTempC(lat: number, month: number): number {
  const annual = 27 - Math.abs(lat) * 0.5;
  const amplitude = 8;
  const peakMonth = lat >= 0 ? 6.5 : 0.5;
  return annual + amplitude * Math.cos(((month - peakMonth) / 12) * 2 * Math.PI);
}

function buildNdvi(claim: Claim): SignalSeries {
  const month = monthOf(claim);
  const seedRand = seededRandom(hashString(`ndvi:${claim.lat},${claim.lon},${month}`));
  const baseline = 0.24 + 0.1 * seedRand();
  const capacity = climateCapacity(claim.lat);
  const trend = (seedRand() * 0.55 - 0.12) * capacity;
  const current = clamp01(baseline + trend);

  const start = claim.activityDate ? new Date(claim.activityDate) : new Date(Date.now() - 365 * 24 * 3600 * 1000);
  const end = new Date();
  return {
    provider: "mock",
    points: [
      { t: start.toISOString(), v: baseline },
      { t: new Date(start.getTime() + 0.5 * (end.getTime() - start.getTime())).toISOString(), v: (baseline + current) / 2 },
      { t: end.toISOString(), v: current },
    ],
  };
}

function buildNdwi(claim: Claim): SignalSeries {
  const month = monthOf(claim);
  const seedRand = seededRandom(hashString(`ndwi:${claim.lat},${claim.lon},${month}`));
  const baseline = -0.05 + 0.1 * seedRand();
  const trend = (seedRand() * 0.4 - 0.15) * climateCapacity(claim.lat);
  const current = clamp01(baseline + trend);

  const start = claim.activityDate ? new Date(claim.activityDate) : new Date(Date.now() - 365 * 24 * 3600 * 1000);
  const end = new Date();
  return {
    provider: "mock",
    points: [
      { t: start.toISOString(), v: baseline },
      { t: end.toISOString(), v: current },
    ],
  };
}

function buildWeather(claim: Claim): SignalWeather {
  const month = monthOf(claim);
  const seedRand = seededRandom(hashString(`weather:${claim.lat},${claim.lon},${month}`));
  const seasonalTemp = seasonalTempC(claim.lat, month);
  const temperatureC = seasonalTemp + (seedRand() * 6 - 3);
  const seasonalPrecipMm = clamp01(0.25 + 0.6 * seedRand()) * 100;
  const precipitationMm = seasonalPrecipMm * (0.5 + seedRand() * 0.9);

  return {
    provider: "mock",
    temperatureC,
    seasonalTempC: seasonalTemp,
    precipitationMm,
    seasonalPrecipMm,
  };
}

export class MockDataFetcher implements DataFetcher {
  async fetchNdvi(claim: Claim): Promise<SignalSeries> {
    return buildNdvi(claim);
  }

  async fetchNdwi(claim: Claim): Promise<SignalSeries> {
    return buildNdwi(claim);
  }

  async fetchWeather(claim: Claim): Promise<SignalWeather> {
    return buildWeather(claim);
  }
}

export const mockDataFetcher = new MockDataFetcher();