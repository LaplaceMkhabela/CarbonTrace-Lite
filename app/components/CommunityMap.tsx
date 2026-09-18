"use client";

import type { ApiClaim } from "@/lib/api";

/*
 * Dependency-free community map: claims are projected equirectangular onto an
 * SVG panel over a blocky, low-res land mask. Markers are coloured by
 * verification status and sized by claimed quantity.
 */

const W = 800;
const H = 400;
const COLS = 40;
const ROWS = 10;
const CELL_W = W / COLS;
const CELL_H = H / ROWS;

/** Land cells: row -> set of filled columns. Hand-tuned from Natural Earth ~10°. */
const LAND: Record<number, number[]> = {
  1: [1, 2, 3, 4, 5, 7, 8, 9, 10, 14, 18, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
  2: [5, 6, 7, 8, 9, 10, 11, 12, 13, 19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
  3: [8, 9, 10, 11, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
  4: [10, 11, 12, 13, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 31, 32, 33, 34, 35, 36],
  5: [11, 12, 13, 14, 15, 19, 20, 21, 22, 23, 24, 33, 34, 35, 36, 37, 38, 39],
  6: [12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 35, 36, 37, 38, 39],
  7: [12, 13, 14, 36, 39],
};

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

function project(lat: number, lon: number): { x: number; y: number } {
  return {
    x: ((lon + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  };
}

function landCells() {
  const cells: Array<{ x: number; y: number }> = [];
  for (let r = 0; r < ROWS; r++) {
    const cols = LAND[r] ?? [];
    for (const c of cols) {
      cells.push({ x: c * CELL_W, y: r * CELL_H });
    }
  }
  return cells;
}

export default function CommunityMap({ claims }: { claims: ApiClaim[] }) {
  const cells = landCells();
  const count = (s: string) => claims.filter((c) => c.status === s).length;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Community carbon map"
        style={{
          width: "100%",
          height: "auto",
          background: "var(--bg-soft)",
          borderRadius: 10,
          border: "1px solid var(--border)",
        }}
      >
        {/* graticule */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`v${i}`}
            x1={(W / 4) * (i + 1)}
            y1={0}
            x2={(W / 4) * (i + 1)}
            y2={H}
            stroke="var(--border)"
            strokeWidth={0.5}
            opacity={0.6}
          />
        ))}
        {[1, 2, 3].map((i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={(H / 4) * i}
            x2={W}
            y2={(H / 4) * i}
            stroke="var(--border)"
            strokeWidth={0.5}
            opacity={0.6}
          />
        ))}

        {/* land mask */}
        {cells.map((c, i) => (
          <rect
            key={i}
            x={c.x + 0.5}
            y={c.y + 0.5}
            width={CELL_W - 1}
            height={CELL_H - 1}
            fill="var(--panel-2)"
            rx={1.5}
          />
        ))}

        {/* claims */}
        {claims.length === 0 && (
          <text x={W / 2} y={H / 2} fill="var(--text-dim)" textAnchor="middle" fontSize={14}>
            No claims yet — submit one to see it on the map
          </text>
        )}
        {claims.map((c) => {
          const p = project(c.lat, c.lon);
          const r = 3 + Math.min(12, Math.log10(c.quantity + 1) * 5);
          const color = STATUS_COLOR[c.status] ?? "#94a3b8";
          return (
            <g key={c.claimId}>
              <circle cx={p.x} cy={p.y} r={r + 3} fill={color} opacity={0.18} />
              <circle cx={p.x} cy={p.y} r={r} fill={color} opacity={0.85}>
                <title>{`${c.claimType} — ${c.quantity} ${c.unit} — ${c.confidence} confidence — ${STATUS_LABEL[c.status]}`}</title>
              </circle>
            </g>
          );
        })}
      </svg>

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
        <span>Marker size ∝ claimed quantity</span>
      </div>
    </div>
  );
}