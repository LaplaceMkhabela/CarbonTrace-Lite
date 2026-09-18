import "dotenv/config";
import { mockDataFetcher, MockDataFetcher } from "./mock";
import { SentinelHubFetcher } from "./sentinel-hub";
import { OpenWeatherFetcher } from "./openweather";
import type { DataFetcher } from "./types";

/**
 * Builds the active data fetcher.
 *
 * - USE_MOCK_DATA=true (default)  → offline deterministic demo provider.
 * - USE_MOCK_DATA=false           → live Sentinel Hub + OpenWeather, if keys are set.
 */
export function buildDataFetcher(): DataFetcher {
  const useMock = (process.env.USE_MOCK_DATA ?? "true").toLowerCase() !== "false";
  if (useMock) return mockDataFetcher;

  const sentinel = new SentinelHubFetcher(
    process.env.SH_CLIENT_ID || undefined,
    process.env.SH_CLIENT_SECRET || undefined,
  );
  const openweather = new OpenWeatherFetcher(process.env.OPENWEATHER_API_KEY || undefined);

  // Composite: weather from OpenWeather, vegetation from Sentinel Hub,
  // falling back to mock for any source that isn't configured.
  const composite: DataFetcher = {
    async fetchNdvi(claim) {
      if (sentinel.configured) return sentinel.fetchNdvi(claim);
      return mockDataFetcher.fetchNdvi(claim);
    },
    async fetchNdwi(claim) {
      if (sentinel.configured) return sentinel.fetchNdwi(claim);
      return mockDataFetcher.fetchNdwi(claim);
    },
    async fetchWeather(claim) {
      if (openweather.configured) return openweather.fetchWeather(claim);
      return mockDataFetcher.fetchWeather(claim);
    },
  };
  return composite;
}

export { MockDataFetcher };