import type { Claim, SignalSeries, SignalWeather } from "@/types/claim";
import type { DataFetcher } from "./types";

/**
 * Live Sentinel Hub client.
 *
 * Uses the Sentinel Hub Statistical API (https://docs.sentinel-hub.com/) with
 * evalscripts that reduce a small area around the claim location to a single
 * NDVI / NDWI value per date. Requires SH_CLIENT_ID / SH_CLIENT_SECRET.
 */

const OAUTH_URL = "https://services.sentinel-hub.com/oauth/token";
const STATISTICS_URL = "https://services.sentinel-hub.com/api/v1/statistics";

const REDUCER = "mean";

const NDVI_EVALSCRIPT = `
  function setup() {
    return { input: ["B04", "B08"], output: { bands: 1, sampleType: "FLOAT32" } };
  }
  function evaluatePixel(sample) {
    let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
    return [ndvi];
  }
`;

const NDWI_EVALSCRIPT = `
  function setup() {
    return { input: ["B03", "B08"], output: { bands: 1, sampleType: "FLOAT32" } };
  }
  function evaluatePixel(sample) {
    let ndwi = (sample.B03 - sample.B08) / (sample.B03 + sample.B08);
    return [ndwi];
  }
`;

type TokenCache = { token: string; expiresAt: number };

class SentinelHubAuth {
  private cache: TokenCache | null = null;

  constructor(
    private clientId: string,
    private clientSecret: string,
  ) {}

  async getToken(): Promise<string> {
    if (this.cache && this.cache.expiresAt > Date.now() + 30_000) {
      return this.cache.token;
    }
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
    const res = await fetch(OAUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      throw new Error(`Sentinel Hub auth failed (${res.status}): ${await res.text()}`);
    }
    const data = (await res.json()) as { access_token: string; expires_in?: number };
    this.cache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    return this.cache.token;
  }
}

function toIso(d: Date): string {
  return d.toISOString();
}

function windowAround(claim: Claim, yearsBack: number, forwardDays: number) {
  const start = claim.activityDate
    ? new Date(claim.activityDate)
    : new Date(Date.now() - yearsBack * 365 * 24 * 3600 * 1000);
  const end = new Date(Date.now() + forwardDays * 24 * 3600 * 1000);
  return { start, end };
}

/** Best-effort extraction of the reduced statistic from a Statistics API response. */
function extractMean(data: unknown): number | null {
  const outputs = (data as { data?: Array<{ data?: Array<{ outputs?: Record<string, unknown> }> }> })
    .data?.[0]?.data;
  if (!outputs) return null;
  for (const entry of outputs) {
    for (const band of Object.values(entry.outputs ?? {})) {
      const mean = (band as { mean?: { mean?: number } }).mean?.mean;
      if (typeof mean === "number") return mean;
    }
  }
  return null;
}

export class SentinelHubFetcher implements DataFetcher {
  private auth: SentinelHubAuth | null = null;

  constructor(clientId?: string, clientSecret?: string) {
    if (clientId && clientSecret) {
      this.auth = new SentinelHubAuth(clientId, clientSecret);
    }
  }

  get configured(): boolean {
    return this.auth !== null;
  }

  private async statistics(
    claim: Claim,
    bandIndex: string,
    evalscript: string,
  ): Promise<SignalSeries> {
    if (!this.auth) throw new Error("SentinelHubFetcher not configured (missing credentials)");
    const token = await this.auth.getToken();
    const { start, end } = windowAround(claim, 2, 7);
    const half = 0.002; // ~200 m box

    const payload = {
      input: {
        bounds: {
          properties: { crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84" },
          bbox: [claim.lon - half, claim.lat - half, claim.lon + half, claim.lat + half],
        },
        data: [
          {
            type: "S2L2A",
            dataFilter: {
              timeRange: { from: toIso(start), to: toIso(end) },
              maxCloudCoverage: 30,
            },
          },
        ],
      },
      aggregations: {
        timeRange: { from: toIso(start), to: toIso(end) },
        aggregation: {
          width: 64,
          height: 64,
          evalscript,
          reducer: REDUCER,
          resampling: "BICUBIC",
          mosaickingOrder: "mostRecent",
        },
      },
    };

    const res = await fetch(STATISTICS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Sentinel Hub statistics failed (${res.status}): ${await res.text()}`);
    }
    const json = (await res.json()) as unknown;
    const dates = (json as { data?: Array<{ data?: Array<{ date: string }> }> }).data?.[0]?.data;
    const points = (dates ?? [])
      .filter((d) => d.date)
      .map((d) => {
        const value = extractMean(d as unknown as { outputs?: Record<string, unknown> });
        return value === null ? null : { t: d.date, v: Number(value.toFixed(4)) };
      })
      .filter((p): p is { t: string; v: number } => p !== null);

    if (points.length === 0) {
      throw new Error(
        `Sentinel Hub returned no data for claim (${claim.lat}, ${claim.lon}). ` +
          `Raw response: ${JSON.stringify(json).slice(0, 500)}`,
      );
    }
    return { provider: "sentinel-hub", points };
  }

  async fetchNdvi(claim: Claim): Promise<SignalSeries> {
    return this.statistics(claim, "NDVI", NDVI_EVALSCRIPT);
  }

  async fetchNdwi(claim: Claim): Promise<SignalSeries> {
    return this.statistics(claim, "NDWI", NDWI_EVALSCRIPT);
  }

  async fetchWeather(_claim: Claim): Promise<SignalWeather | null> {
    return null; // weather is handled by OpenWeather
  }
}