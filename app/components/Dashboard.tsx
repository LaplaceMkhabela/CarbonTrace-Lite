"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchClaims, type ApiClaim, type ApiStats } from "@/lib/api";
import CommunityMap from "./CommunityMap";
import SubmitClaim from "./SubmitClaim";
import ClaimFeed from "./ClaimFeed";
import FlaggedQueue from "./FlaggedQueue";

const EMPTY_STATS: ApiStats = {
  totalClaims: 0,
  verifiedClaims: 0,
  flaggedClaims: 0,
  totalCreditsAwarded: 0,
};

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

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetchClaims();
      if (res.ok) {
        setClaims(res.claims.map((c) => c.result));
        setStats(res.stats);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recent = claims.slice(0, 12);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <section>
        <div className="grid grid-stats">
          <div className="card stat">
            <div className="label">Claims</div>
            <div className="value">{stats.totalClaims}</div>
          </div>
          <div className="card stat">
            <div className="label">Verified</div>
            <div className="value" style={{ color: "var(--verified)" }}>
              {stats.verifiedClaims}
            </div>
          </div>
          <div className="card stat">
            <div className="label">Awaiting review</div>
            <div className="value" style={{ color: "var(--flagged)" }}>
              {stats.flaggedClaims}
            </div>
          </div>
          <div className="card stat">
            <div className="label">Credits issued</div>
            <div className="value" style={{ color: "var(--amber)" }}>
              {stats.totalCreditsAwarded} CTC
            </div>
          </div>
        </div>
      </section>

      <section>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.55rem" }}>
          <h2>Community map</h2>
          <span className="chip">{refreshing ? "refreshing…" : `${claims.length} claims`}</span>
        </div>
        <CommunityMap claims={claims} />
      </section>

      <section className="grid grid-2">
        <div className="card">
          <h2>Submit a claim</h2>
          <SubmitClaim onSubmitted={() => void refresh()} />
        </div>
        <div className="card">
          <h2>Flagged — community review</h2>
          <FlaggedQueue claims={claims} />
        </div>
      </section>

      <section className="card">
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
          <h2>Recent claims</h2>
          <span className="chip">most recent first</span>
        </div>
        <div style={{ marginTop: "0.5rem" }}>
          <ClaimFeed claims={recent} />
        </div>
      </section>
    </div>
  );
}