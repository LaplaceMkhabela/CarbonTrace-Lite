"use client";

import { useState } from "react";
import {
  CLAIM_TYPES,
  CLAIM_TYPE_LABELS,
  DEFAULT_UNIT,
  shortHash,
  submitVerify,
  type VerifyResponse,
} from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  verified: "badge badge-verified",
  partial: "badge badge-partial",
  flagged: "badge badge-flagged",
};

export default function SubmitClaim({ onSubmitted }: { onSubmitted?: () => void }) {
  const [claimType, setClaimType] = useState("tree-planted");
  const [lat, setLat] = useState("-26.2");
  const [lon, setLon] = useState("28.05");
  const [quantity, setQuantity] = useState("40");
  const [unit, setUnit] = useState("trees");
  const [agentRef, setAgentRef] = useState("school@greenfield");
  const [activityDate, setActivityDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onTypeChange(t: string) {
    setClaimType(t);
    setUnit(DEFAULT_UNIT[t as keyof typeof DEFAULT_UNIT] ?? "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const claim: Record<string, unknown> = {
      claimType,
      lat: Number(lat),
      lon: Number(lon),
      quantity: Number(quantity),
      unit,
    };
    if (activityDate) claim.activityDate = new Date(activityDate).toISOString();
    try {
      const res = await submitVerify({ claim, agentRef: agentRef.trim() || undefined, note: note.trim() || undefined });
      if (res.ok) {
        setResult(res);
        onSubmitted?.();
      } else {
        setError(res.error ?? "Verification failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  const defaultDate = new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  return (
    <div>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.9rem" }}>
        <div className="form-grid">
          <label className="field">
            Claim type
            <select value={claimType} onChange={(e) => onTypeChange(e.target.value)}>
              {CLAIM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CLAIM_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Quantity
            <input
              type="number"
              min="0.01"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>
          <label className="field">
            Unit
            <input value={unit} onChange={(e) => setUnit(e.target.value)} required />
          </label>
          <label className="field">
            Activity date (optional)
            <input type="date" value={activityDate || defaultDate} onChange={(e) => setActivityDate(e.target.value || "")} />
          </label>
        </div>

        <div className="form-grid">
          <label className="field">
            Latitude
            <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} required />
          </label>
          <label className="field">
            Longitude
            <input type="number" step="any" value={lon} onChange={(e) => setLon(e.target.value)} required />
          </label>
          <label className="field">
            Team / agent (optional)
            <input value={agentRef} onChange={(e) => setAgentRef(e.target.value)} placeholder="school@greenfield" />
          </label>
        </div>

        <label className="field">
          Note (optional)
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 40 seedlings planted along the riverbank" />
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" /> Verifying against satellite + weather…
              </>
            ) : (
              "Verify & attest claim"
            )}
          </button>
          <span className="muted" style={{ fontSize: "0.8rem" }}>
            The engine cross-checks your claim against independent NDVI/NDWI and weather data.
          </span>
        </div>
      </form>

      {error && (
        <p style={{ color: "var(--flagged)", fontSize: "0.88rem", marginTop: "1rem" }}>{error}</p>
      )}

      {result?.ok && (
        <div className="card" style={{ marginTop: "1.1rem", background: "var(--panel-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Verification result</h2>
            <span className={STATUS_BADGE[result.result.status]}>{result.result.status}</span>
            <span className="chip">confidence {Math.round(result.result.confidence * 100)}%</span>
            <span className="chip">
              {result.credits} CTC awarded
            </span>
          </div>

          <div className="confbar" style={{ margin: "0.8rem 0" }}>
            <div
              style={{
                width: `${result.result.confidence * 100}%`,
                background:
                  result.result.status === "verified"
                    ? "var(--verified)"
                    : result.result.status === "partial"
                      ? "var(--partial)"
                      : "var(--flagged)",
              }}
            />
          </div>

          <ul className="reason-list">
            {(result.result.signalsBreakdown ?? []).map((s) => (
              <li key={s.name}>
                <strong>[{s.name}]</strong> {s.reason}
              </li>
            ))}
          </ul>

          <div style={{ marginTop: "0.8rem", fontSize: "0.85rem", color: "var(--text-dim)" }}>
            <div>
              Claim id <code>{result.result.claimId}</code> · agent {result.owner.displayName}
            </div>
            <div>
              Attestation: <code>{result.attestation.network}</code> · tx{" "}
              <code>{shortHash(result.attestation.txHash)}</code> · hash{" "}
              <code>{result.attestation.claimFingerprint}</code>
            </div>
            <a href={`/claims/${result.result.claimId}`} style={{ fontSize: "0.85rem" }}>
              Open certificate →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}