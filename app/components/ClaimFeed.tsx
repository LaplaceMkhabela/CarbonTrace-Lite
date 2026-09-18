"use client";

import Link from "next/link";
import { CLAIM_TYPE_LABELS, shortHash, type ApiClaim } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  verified: "badge badge-verified",
  partial: "badge badge-partial",
  flagged: "badge badge-flagged",
};

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function displayAgent(ref?: string): string {
  return ref?.replace(/^user:/, "") ?? "community";
}

export default function ClaimFeed({ claims }: { claims: ApiClaim[] }) {
  if (claims.length === 0) {
    return <p className="muted" style={{ fontSize: "0.88rem" }}>No claims submitted yet.</p>;
  }
  return (
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
          {claims.map((c) => (
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
              <td>
                {c.quantity} {c.unit}
              </td>
              <td>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <span className="confbar" style={{ width: 56 }}>
                    <div
                      style={{
                        width: `${c.confidence * 100}%`,
                        background: "var(--accent-2)",
                      }}
                    />
                  </span>
                  {Math.round(c.confidence * 100)}%
                </span>
              </td>
              <td>
                <span className={STATUS_BADGE[c.status]}>{c.status}</span>
              </td>
              <td>{c.creditsAwarded > 0 ? `${c.creditsAwarded} CTC` : "—"}</td>
              <td className="muted">{fmtDate(c.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AttestCell({ txHash }: { txHash?: string }) {
  return <code className="muted">{txHash ? shortHash(txHash) : "—"}</code>;
}