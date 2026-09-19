"use client";

import type { ApiClaim } from "@/lib/api";

/*
 * Verification-ratio donut (SVG, computed segments — no hardcoded offsets).
 * Emerald = verified, amber = partial, coral = flagged.
 */

const R = 48;
const C = 2 * Math.PI * R;

function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  const v = (n / total) * 100;
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}

export default function VerificationRatio({ claims }: { claims: ApiClaim[] }) {
  const total = claims.length;
  const segs = [
    { key: "verified", label: "Verified", count: claims.filter((c) => c.status === "verified").length, color: "var(--verified)" },
    { key: "partial", label: "Partial", count: claims.filter((c) => c.status === "partial").length, color: "var(--amber)" },
    { key: "flagged", label: "Flagged", count: claims.filter((c) => c.status === "flagged").length, color: "var(--red)" },
  ];

  let acc = 0;
  const arcs = segs.map((s) => {
    const frac = total === 0 ? 0 : s.count / total;
    const arc = { ...s, frac, startDeg: acc * 360, len: frac * C };
    acc += frac;
    return arc;
  });

  const verifiedShare = total === 0 ? 0 : (segs[0].count / total) * 100;

  return (
    <div>
      <div className="donut-wrap">
        <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
          <svg width="160" height="160" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--track-bg)" strokeWidth="10" />
            {arcs.map(
              (a) =>
                a.len > 0 && (
                  <circle
                    key={a.key}
                    cx="60"
                    cy="60"
                    r={R}
                    fill="none"
                    stroke={a.color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${a.len} ${C - a.len}`}
                    style={{ transform: `rotate(${a.startDeg}deg)`, transformOrigin: "60px 60px" }}
                  />
                ),
            )}
          </svg>
          <div className="donut-center" style={{ inset: 0 }}>
            <span className="donut-pct tnum">
              {verifiedShare % 1 === 0 ? verifiedShare.toFixed(0) : verifiedShare.toFixed(1)}%
            </span>
            <span className="donut-cap">Attested</span>
          </div>
        </div>
        <div className="donut-rows">
          {arcs.map((a) => (
            <div key={a.key} className="donut-row">
              <span className="left">
                <span className="status-dot" style={{ background: a.color, marginRight: 0 }} />
                {a.label}
              </span>
              <span className="right">
                <span className="donut-count tnum">{a.count}</span>
                <span
                  className="donut-share tnum"
                  style={{ background: `color-mix(in srgb, ${a.color} 15%, transparent)`, color: a.color }}
                >
                  {pct(a.count, total)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="muted" style={{ fontSize: "0.75rem", margin: "0.75rem 0 0" }}>
        Satellite confidence threshold ≥85% · Passed {segs[0].count}/{total}
      </p>
    </div>
  );
}
