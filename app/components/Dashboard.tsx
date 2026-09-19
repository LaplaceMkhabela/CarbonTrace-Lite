"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchClaims, toApiClaim, type ApiClaim, type ApiStats } from "@/lib/api";
import CommunityMap, { type MapStatusFilter } from "./CommunityMap";
import SubmitClaim from "./SubmitClaim";
import FlaggedQueue from "./FlaggedQueue";
import VerificationRatio from "./VerificationRatio";
import IssuanceTrend from "./IssuanceTrend";
import LedgerTable from "./LedgerTable";

const EMPTY_STATS: ApiStats = {
  totalClaims: 0,
  verifiedClaims: 0,
  flaggedClaims: 0,
  totalCreditsAwarded: 0,
};

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    Number.isFinite(d.getTime()) &&
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function Dashboard({
  initialClaims,
  initialStats,
}: {
  initialClaims: ApiClaim[];
  initialStats: ApiStats;
}) {
  const [claims, setClaims] = useState<ApiClaim[]>(initialClaims);
  const [stats, setStats] = useState<ApiStats>(initialStats);
  const [refreshing, setRefreshing] = useState(false);
  const [mapFilter, setMapFilter] = useState<MapStatusFilter>("all");

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetchClaims();
      if (res.ok) {
        // The API returns nested verification results — flatten to the same
        // ApiClaim shape the server render uses, or markers/rows go blank.
        // On failure keep the previous claims instead of blanking the UI.
        setClaims(res.claims.map((c) => toApiClaim(c.result)));
        setStats(res.stats);
      }
    } catch {
      // Keep showing the last good data; the next refresh will retry.
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verified = claims.filter((c) => c.status === "verified").length;
  const flagged = claims.filter((c) => c.status === "flagged").length;
  const todayCount = useMemo(() => claims.filter((c) => isToday(c.createdAt)).length, [claims]);
  const verifiedPct = claims.length === 0 ? 0 : Math.round((verified / claims.length) * 100);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {/* Hero */}
      <section className="hero">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            Decentralized MRV · Protocol v2.4
          </div>
          <h1>Community carbon ledger</h1>
          <p className="subtitle" style={{ margin: 0, maxWidth: "42rem" }}>
            Every environmental action is cross-checked against independent satellite and weather
            data before credits are minted. No self-reported number is trusted on its own.
          </p>
        </div>
        <span className="sync-pill">
          <span className="pulse" />
          Sentinel-2 L2A Active Synced
        </span>
      </section>

      {/* Metric ribbon */}
      <section className="metric-ribbon">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Claims</span>
            <span className="metric-icon">▤</span>
          </div>
          <div className="metric-bottom">
            <span className="metric-value tnum">{stats.totalClaims}</span>
            <span className="metric-sub green">↑ +{todayCount} today</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Verified</span>
            <span className="metric-icon ok">✓</span>
          </div>
          <div className="metric-bottom">
            <span className="metric-value green tnum">{stats.verifiedClaims}</span>
            <span className="metric-sub green">{verifiedPct}% SLA</span>
          </div>
        </div>
        <div className="metric-card tint-amber">
          <div className="metric-top">
            <span className="metric-label">Awaiting review</span>
            <span className="metric-icon warn">●</span>
          </div>
          <div className="metric-bottom">
            <span className="metric-value amber tnum">{stats.flaggedClaims}</span>
            <span className="metric-sub amber">
              {stats.flaggedClaims > 0 ? "Needs review" : "All clear"}
            </span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Credits issued</span>
            <span className="metric-icon">◉</span>
          </div>
          <div className="metric-bottom">
            <span className="metric-value tnum">
              {stats.totalCreditsAwarded}
              <span className="unit">CTC</span>
            </span>
            <span className="metric-sub dim">Verified ledger</span>
          </div>
        </div>
      </section>

      {/* Ratio + trend */}
      <section className="grid grid-2">
        <div className="card">
          <div className="panel-head">
            <h2>Verification ratio</h2>
            <span className="metric-sub green">Live SLA</span>
          </div>
          <p className="panel-sub tnum" style={{ margin: "0 0 0.5rem" }}>
            {claims.length} total claims
          </p>
          <VerificationRatio claims={claims} />
        </div>
        <div className="card">
          <div className="panel-head">
            <h2>Historical issuance trend</h2>
          </div>
          <IssuanceTrend claims={claims} />
        </div>
      </section>

      {/* Map */}
      <section className="card">
        <div className="panel-head">
          <h2>Community map</h2>
          <span className="chip tnum">{refreshing ? "refreshing…" : `${claims.length} claims`}</span>
        </div>
        <CommunityMap claims={claims} statusFilter={mapFilter} onFilterChange={setMapFilter} />
      </section>

      {/* Submit + flagged */}
      <section className="grid grid-2">
        <div className="card">
          <div className="panel-head">
            <h2>Submit a claim</h2>
            <span className="chip">Independent · IRBV</span>
          </div>
          <SubmitClaim onSubmitted={() => void refresh()} />
        </div>
        <div className="card">
          <div className="panel-head">
            <h2>Flagged — community review</h2>
            <span className="metric-sub amber tnum">
              {flagged} pending
            </span>
          </div>
          <FlaggedQueue claims={claims} />
        </div>
      </section>

      {/* Ledger */}
      <section className="card">
        <div className="panel-head">
          <h2>
            Recent claims{" "}
            <span className="metric-sub green" style={{ marginLeft: "0.4rem" }}>
              most recent first
            </span>
          </h2>
        </div>
        <LedgerTable claims={claims} />
      </section>
    </div>
  );
}
