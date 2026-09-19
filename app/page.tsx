import type { Metadata } from "next";
import { getRepository } from "@/storage";
import Dashboard from "./components/Dashboard";
import { toApiClaim, type ApiStats } from "@/lib/api";

export const metadata: Metadata = {
  title: "CarbonTrace Lite — Community carbon ledger",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const repo = getRepository();
  const [records, stats] = await Promise.all([repo.listClaims(100, 0), repo.getStats()]);
  // Single source of truth for the wire → UI shape (shared with Dashboard.refresh).
  const claims = records.map((c) => toApiClaim(c.result));

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