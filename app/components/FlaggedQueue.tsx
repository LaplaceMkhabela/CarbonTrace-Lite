"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CLAIM_TYPE_LABELS, type ApiClaim } from "@/lib/api";

/*
 * Community review surface for flagged claims. Verdicts and notes are stored
 * locally (off-chain) — the on-chain attestation is immutable, so "reviewed"
 * here means a human moderator has acknowledged the flag and appended a note.
 */

const STORAGE_KEY = "ct-flagged-review";

interface ReviewNote {
  reviewed: boolean;
  note: string;
}

function loadNotes(): Record<string, ReviewNote> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, ReviewNote>;
  } catch {
    return {};
  }
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function FlaggedQueue({ claims }: { claims: ApiClaim[] }) {
  const flagged = claims.filter((c) => c.status === "flagged");
  const [notes, setNotes] = useState<Record<string, ReviewNote>>({});

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  function update(id: string, partial: Partial<ReviewNote>) {
    const existing: ReviewNote = notes[id] ?? { reviewed: false, note: "" };
    const next = { ...notes, [id]: { ...existing, ...partial } };
    setNotes(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  if (flagged.length === 0) {
    return <p className="muted" style={{ fontSize: "0.88rem" }}>No flagged claims — the verification engine is content.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {flagged.map((c) => (
        <div key={c.claimId} className="card" style={{ background: "var(--panel-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href={`/claims/${c.claimId}`} style={{ fontWeight: 600 }}>
              {CLAIM_TYPE_LABELS[c.claimType]} · {c.quantity} {c.unit}
            </Link>
            <span className="chip">confidence {Math.round(c.confidence * 100)}%</span>
            <span className="chip">anomaly {Math.round(c.anomalyScore * 100)}%</span>
            <span className="chip">{fmtDate(c.createdAt)}</span>
          </div>

          <ul className="reason-list" style={{ marginTop: "0.6rem" }}>
            {(c.signalsBreakdown ?? [])
              .filter((s) => s.name === "verification" || s.name === "quantity" || s.name === "season")
              .slice(0, 3)
              .map((s) => (
                <li key={s.name}>
                  <strong>[{s.name}]</strong> {s.reason}
                </li>
              ))}
          </ul>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.7rem", alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
              <input
                type="checkbox"
                checked={Boolean(notes[c.claimId]?.reviewed)}
                onChange={(e) => update(c.claimId, { reviewed: e.target.checked })}
              />
              Mark reviewed
            </label>
            <input
              placeholder="Review note (e.g. 'community confirmed via photos')"
              value={notes[c.claimId]?.note ?? ""}
              onChange={(e) => update(c.claimId, { note: e.target.value })}
              style={{ flex: 1, minWidth: 220 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}