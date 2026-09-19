"use client";

import { useMemo, useState } from "react";
import type { ApiClaim } from "@/lib/api";

/*
 * Historical issuance trend: cumulative CTC minted per day as an SVG area
 * chart, derived from claim records. Range tabs filter the time window.
 */

type Range = "30D" | "90D" | "All";

const W = 600;
const H = 180;
const PAD_L = 38;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 26;

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function IssuanceTrend({ claims }: { claims: ApiClaim[] }) {
  const [range, setRange] = useState<Range>("All");

  const { points, total, max } = useMemo(() => {
    const days = range === "All" ? Infinity : range === "30D" ? 30 : 90;
    const cutoff = Date.now() - days * 24 * 3600 * 1000;
    const perDay = new Map<string, number>();
    for (const c of claims) {
      const t = new Date(c.createdAt).getTime();
      if (!Number.isFinite(t) || t < cutoff) continue;
      const k = dayKey(c.createdAt);
      perDay.set(k, (perDay.get(k) ?? 0) + (c.creditsAwarded || 0));
    }
    const keys = [...perDay.keys()].sort();
    let cum = 0;
    const pts = keys.map((k) => {
      cum += perDay.get(k)!;
      return { day: k, cum };
    });
    // Anchor the curve at zero on the day before the first issuance.
    if (pts.length > 0) {
      const [y, m, d] = pts[0].day.split("-").map(Number);
      const prev = new Date(y, m - 1, d - 1);
      const pk = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(prev.getDate()).padStart(2, "0")}`;
      pts.unshift({ day: pk, cum: 0 });
    }
    return { points: pts, total: cum, max: cum };
  }, [claims, range]);

  const iw = W - PAD_L - PAD_R;
  const ih = H - PAD_T - PAD_B;
  const x = (i: number) => (points.length <= 1 ? PAD_L + iw / 2 : PAD_L + (i / (points.length - 1)) * iw);
  const y = (v: number) => (max <= 0 ? PAD_T + ih : PAD_T + ih - (v / max) * ih);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.cum).toFixed(1)}`).join(" ");
  const area = points.length > 0 ? `${line} L${x(points.length - 1).toFixed(1)},${(PAD_T + ih).toFixed(1)} L${x(0).toFixed(1)},${(PAD_T + ih).toFixed(1)} Z` : "";
  const ticks = [0.25, 0.5, 0.75].map((f) => Math.round(max * f));
  const last = points[points.length - 1];

  return (
    <div>
      <div className="panel-head" style={{ marginBottom: "0.25rem" }}>
        <span className="chip tnum">+{total} CTC minted</span>
        <div className="seg">
          {(["30D", "90D", "All"] as const).map((r) => (
            <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>
      {points.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.85rem", padding: "2rem 0", textAlign: "center" }}>
          No issuance in this window yet.
        </p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Issuance trend">
          <defs>
            <linearGradient id="issuanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={PAD_L}
              x2={W - PAD_R}
              y1={PAD_T + ih * (1 - f)}
              y2={PAD_T + ih * (1 - f)}
              stroke="var(--border)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          ))}
          <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + ih} y2={PAD_T + ih} stroke="var(--border)" strokeWidth="1" />
          {ticks.map((t, i) => (
            <text key={i} x={PAD_L - 6} y={PAD_T + ih * (1 - [0.25, 0.5, 0.75][i]) + 4} textAnchor="end" fontSize="10" fill="var(--text-faint)" className="tnum">
              {t}
            </text>
          ))}
          <path d={area} fill="url(#issuanceFill)" />
          <path d={line} fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {last && (
            <g>
              <circle cx={x(points.length - 1)} cy={y(last.cum)} r="4" fill="var(--verified)" stroke="var(--bg)" strokeWidth="2" />
              <text x={x(0)} y={H - 8} fontSize="10" fill="var(--text-faint)">
                {fmtDay(points[0].day)}
              </text>
              <text x={x(points.length - 1)} y={H - 8} fontSize="10" fill="var(--verified)" textAnchor="end" className="tnum">
                {fmtDay(last.day)} ({last.cum} CTC)
              </text>
            </g>
          )}
        </svg>
      )}
    </div>
  );
}
