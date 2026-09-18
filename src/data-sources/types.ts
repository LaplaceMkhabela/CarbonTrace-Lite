import type { Claim, SignalSeries, SignalWeather } from "@/types/claim";

/**
 * Interface implemented by every data provider. The engine depends only on
 * this interface so live APIs and the offline demo provider are interchangeable.
 */
export interface DataFetcher {
  /** Multi-date vegetation index (NDVI). Granularity depends on provider. */
  fetchNdvi(claim: Claim): Promise<SignalSeries | null>;
  /** Multi-date water index (NDWI), used for wetland claims. */
  fetchNdwi(claim: Claim): Promise<SignalSeries | null>;
  /** Weather for the claim location, including seasonal norms. */
  fetchWeather(claim: Claim): Promise<SignalWeather | null>;
}