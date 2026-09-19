"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CLAIM_TYPE_LABELS, type ApiClaim } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  verified: "badge badge-verified",
  partial: "badge badge-partial",
  flagged: "badge badge-flagged",
};

const PAGE_SIZE = 8;

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function displayAgent(ref?: string): string {
  return ref?.replace(/^user:/, "") ?? "community";
}

function toCsv(rows: ApiClaim[]): string {
  const head = "claimId,claimType,agent,quantity,unit,confidence,status,creditsAwarded,createdAt";
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((c) =>
    [c.claimId, c.claimType, displayAgent(c.agentRef), c.quantity, c.unit, c.confidence, c.status, c.creditsAwarded, c.createdAt]
      .map(esc)
      .join(","),
  );
  return [head, ...lines].join("\n");
}

/*
 * Ledger table: search filter, CSV export, and pagination over claims,
 * most-recent-first.
 */
export default function LedgerTable({ claims }: { claims: ApiClaim[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return claims;
    return claims.filter((c) =>
      [c.claimId, c.claimType, displayAgent(c.agentRef), c.status, String(c.quantity), c.unit]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [claims, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carbontrace-claims.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="claims-toolbar" style={{ marginBottom: "0.75rem" }}>
        <input
          className="search-input"
          placeholder="Filter claims…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
        <span style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={filtered.length === 0}>
          ⭳ Export CSV
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.88rem" }}>
          No claims match.
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Agent</th>
                <th>Quantity</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Credits</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.claimId}>
                  <td>
                    <Link href={`/claims/${c.claimId}`}>{CLAIM_TYPE_LABELS[c.claimType]}</Link>
                  </td>
                  <td>
                    {c.agentRef ? (
                      <a href={`/agents/${displayAgent(c.agentRef)}`}>{displayAgent(c.agentRef)}</a>
                    ) : (
                      <span className="muted">community</span>
                    )}
                  </td>
                  <td className="tnum">
                    {c.quantity} {c.unit}
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                      <span className="confbar" style={{ width: 56 }}>
                        <div
                          style={{
                            width: `${Math.round(c.confidence * 100)}%`,
                            background: "var(--accent-2)",
                          }}
                        />
                      </span>
                      <span className="tnum">{Math.round(c.confidence * 100)}%</span>
                    </span>
                  </td>
                  <td>
                    <span className={STATUS_BADGE[c.status]}>{c.status}</span>
                  </td>
                  <td className="tnum">{c.creditsAwarded > 0 ? `${c.creditsAwarded} CTC` : "—"}</td>
                  <td className="muted">{fmtDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <span className="tnum">
          Showing {rows.length} of {filtered.length} recorded ledger claims
        </span>
        <span className="pages">
          <button
            className="btn btn-ghost btn-sm"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={safePage >= pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
          >
            Next
          </button>
        </span>
      </div>
    </div>
  );
}
