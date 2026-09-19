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
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {(["verified", "partial", "flagged"] as const).map((s) => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center" }}>
              {s === "flagged" ? (
                <img
                  src="/flagged-pin.svg"
                  alt="Flagged pin"
                  width={13}
                  height={18}
                  style={{ marginRight: "0.35rem" }}
                />
              ) : s === "verified" ? (
                <img
                  src="/verified-pin.svg"
                  alt="Verified pin"
                  width={14}
                  height={14}
                  style={{ marginRight: "0.35rem" }}
                />
              ) : (
                <img
                  src="/partial-pin.svg"
                  alt="Partial pin"
                  width={14}
                  height={14}
                  style={{ marginRight: "0.35rem" }}
                />
              )}
              {STATUS_LABEL[s]} · {count(s)}
            </span>
          ))}
        </div>
        <span>Marker size ∝ claimed quantity · click a marker for details</span>
      </div>
    </div>
  );
}
