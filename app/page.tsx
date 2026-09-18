import type { Metadata } from "next";
import { getRepository } from "@/storage";
import Dashboard from "./components/Dashboard";
import type { ApiClaim, ApiStats } from "@/lib/api";

export const metadata: Metadata = {
  title: "CarbonTrace Lite — Community carbon ledger",
};

export const dynamic = "force-dynamic";

function toApiClaim(c: {
  result: {
    claimId: string;
    claim: {
      claimType: string;
      lat: number;
      lon: number;
      quantity: number;
      unit: string;
      agentRef?: string;
    };
    confidence: number;
    anomalyScore: number;
    status: string;
    multiplier: number;
    creditsAwarded: number;
    createdAt: string;
    signalsBreakdown?: Array<{ name: string; value: number; reason: string }>;
    signals?: { provider: { ndvi: string; ndwi: string; weather: string } };
  };
}): ApiClaim {
  return {
    claimId: c.result.claimId,
    claimType: c.result.claim.claimType as ApiClaim["claimType"],
    lat: c.result.claim.lat,
    lon: c.result.claim.lon,
    quantity: c.result.claim.quantity,
    unit: c.result.claim.unit,
    agentRef: c.result.claim.agentRef,
    confidence: c.result.confidence,
    anomalyScore: c.result.anomalyScore,
    status: c.result.status as ApiClaim["status"],
    multiplier: c.result.multiplier,
    creditsAwarded: c.result.creditsAwarded,
    createdAt: c.result.createdAt,
    signalsBreakdown: c.result.signalsBreakdown,
    signals: c.result.signals,
  };
}

export default async function HomePage() {
  const repo = getRepository();
  const [records, stats] = await Promise.all([repo.listClaims(100, 0), repo.getStats()]);
  const claims = records.map(toApiClaim);

  return (
    <main className="page">
      <h1>Community carbon ledger</h1>
      <p className="subtitle">
        Every environmental action is cross-checked against independent satellite and weather
        data before credits are minted. No self-reported number is trusted on its own.
      </p>
      <Dashboard
        initialClaims={claims}
        initialStats={stats satisfies ApiStats}
      />
    </main>
  );
}