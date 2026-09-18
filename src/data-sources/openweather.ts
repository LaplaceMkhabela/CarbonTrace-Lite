import type { Claim, SignalWeather } from "@/types/claim";
import type { DataFetcher } from "./types";

/**
 * OpenWeather client.
 *
 * Fetches current conditions + a 7-day forecast for a location and derives a
 * "seasonal norm" (mean of forecast temps). Requires OPENWEATHER_API_KEY.
 */

const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

export class OpenWeatherFetcher implements DataFetcher {
  constructor(private apiKey?: string) {}

  get configured(): boolean {
    return Boolean(this.apiKey);
  }

  async fetchNdvi(_claim: Claim): Promise<null> {
    return null;
  }

  async fetchNdwi(_claim: Claim): Promise<null> {
    return null;
  }

  async fetchWeather(claim: Claim): Promise<SignalWeather | null> {
    if (!this.apiKey) return null;
    const url = `${CURRENT_URL}?lat=${claim.lat}&lon=${claim.lon}&units=metric&appid=${this.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`OpenWeather current failed (${res.status}): ${await res.text()}`);
    }
    const now = (await res.json()) as {
      main?: { temp?: number };
      rain?: { "1h"?: number; "3h"?: number };
    };

    const fRes = await fetch(`${FORECAST_URL}?lat=${claim.lat}&lon=${claim.lon}&units=metric&appid=${this.apiKey}`);
    if (!fRes.ok) {
      throw new Error(`OpenWeather forecast failed (${fRes.status}): ${await fRes.text()}`);
    }
    const forecast = (await fRes.json()) as { list?: Array<{ main?: { temp?: number } }> };

    const temps = (forecast.list ?? [])
      .map((l) => l.main?.temp)
      .filter((t): t is number => typeof t === "number");
    const seasonalTempC =
      temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : now.main?.temp ?? 15;

    return {
      provider: "openweather",
      temperatureC: now.main?.temp ?? seasonalTempC,
      seasonalTempC,
      precipitationMm: (now.rain?.["1h"] ?? now.rain?.["3h"] ?? 0) * 24,
      seasonalPrecipMm: 60, // rough default; forecast rain is not exposed per-day on this plan
    };
  }
}