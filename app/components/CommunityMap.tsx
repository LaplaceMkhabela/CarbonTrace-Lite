"use client";

import dynamic from "next/dynamic";
import type { ApiClaim } from "@/lib/api";

/*
 * Leaflet pulls in `window` at import time, so the real map is client-only.
 * This wrapper keeps the import graph SSR-safe and owns the legend.
 */

const CommunityMapInner = dynamic(() => import("./CommunityMapInner"), {
  ssr: false,
  loading: () => (
    <div className="leaflet-map leaflet-map-loading">
      <span className="muted">Loading map…</span>
    </div>
  ),
});

const STATUS_COLOR: Record<string, string> = {
  verified: "#34d399",
  partial: "#fbbf24",
  flagged: "#f87171",
};

const STATUS_LABEL: Record<string, string> = {
  verified: "Verified",
  partial: "Partial",
  flagged: "Flagged",
};

export default function CommunityMap({ claims }: { claims: ApiClaim[] }) {
  const count = (s: string) => claims.filter((c) => c.status === s).length;

  return (
    <div>
      <CommunityMapInner claims={claims} />

      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginTop: "0.6rem",
          fontSize: "0.8rem",
          color: "var(--text-dim)",
        }}
      >
        <div style={{ display: "flex", gap: "1rem" }}>
          {(["verified", "partial", "flagged"] as const).map((s) => (
            <span key={s}>
              <span className="status-dot" style={{ background: STATUS_COLOR[s] }} />
              {STATUS_LABEL[s]} · {count(s)}
            </span>
          ))}
        </div>
        <span>Marker size ∝ claimed quantity · click a marker for details</span>
      </div>
    </div>
  );
}
