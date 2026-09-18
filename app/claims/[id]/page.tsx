import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRepository } from "@/storage";
import { CLAIM_TYPE_LABELS, type VerificationResult } from "@/types/claim";
import CertificateActions from "../../components/CertificateActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Claim certificate — CarbonTrace Lite",
};

const STATUS_BADGE: Record<string, string> = {
  verified: "badge badge-verified",
  partial: "badge badge-partial",
  flagged: "badge badge-flagged",
};

function shortTx(tx: string): string {
  if (!tx || tx.length <= 20) return tx || "—";
  return `${tx.slice(0, 10)}…${tx.slice(-8)}`;
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
}

function CertRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.35rem 0", borderBottom: "1px dashed var(--border)" }}>
      <span className="muted">{k}</span>
      <span style={{ textAlign: "right", fontFamily: "inherit" }}>{v}</span>
    </div>
  );
}

export default async function ClaimDetail({ params }: { params: { id: string } }) {
  const repo = getRepository();
  const record = await repo.getClaim(params.id);
  if (!record) notFound();

  const r: VerificationResult = record.result;
  const a = record.attestation;
  const label = CLAIM_TYPE_LABELS[r.claim.claimType] ?? r.claim.claimType;
  const provider = r.signals.provider;
  const sources = [provider.ndvi, provider.ndwi, provider.weather].filter((p) => p && p !== "none");

  const certificate = (
    <div
      id="certificate-panel"
      style={{
        background: "linear-gradient(160deg, var(--panel) 0%, var(--bg-soft) 100%)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "1.6rem 1.75rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -60,
          top: -60,
          width: 190,
          height: 190,
          borderRadius: "50%",
          border: "22px solid rgba(52,211,153,0.08)",
          opacity: r.status === "verified" ? 1 : 0.4,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ letterSpacing: "0.18em", fontSize: "0.72rem", color: "var(--accent)", fontWeight: 700 }}>
            CARBONTRACE · VERIFIED CARBON CREDIT CERTIFICATE
          </div>
          <h1 style={{ fontSize: "1.45rem", margin: "0.4rem 0 0.1rem" }}>
            {label}
          </h1>
          <div className="muted" style={{ fontSize: "0.85rem" }}>
            Community-verified environmental action · certificate #{r.claimId}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className={STATUS_BADGE[r.status]}>{r.status}</span>
          <div style={{ marginTop: "0.5rem", fontSize: "1.6rem", fontWeight: 800, color: "var(--amber)" }}>
            {r.creditsAwarded} CTC
          </div>
          <div className="muted" style={{ fontSize: "0.75rem" }}>
            carbon credits issued
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2rem", marginTop: "1.1rem" }}>
        <div>
          <CertRow k="Quantity" v={`${r.claim.quantity} ${r.claim.unit}`} />
          <CertRow k="Location" v={`${r.claim.lat.toFixed(4)}, ${r.claim.lon.toFixed(4)}`} />
          <CertRow k="Agent" v={r.claim.agentRef ?? "community"} />
          <CertRow k="Activity date" v={r.claim.activityDate ? fmtDate(r.claim.activityDate) : "not specified"} />
          <CertRow k="Claimed on" v={fmtDate(r.createdAt)} />
        </div>
        <div>
          <CertRow k="Confidence" v={`${Math.round(r.confidence * 100)}%`} />
          <CertRow k="Anomaly score" v={r.anomalyScore.toFixed(3)} />
          <CertRow k="Credit multiplier" v={`×${r.multiplier}`} />
          <CertRow k="Data sources" v={sources.length > 0 ? sources.join(", ") : "none available"} />
          <CertRow k="Chain mode" v={a?.network ?? "simulated"} />
        </div>
      </div>

      <div
        style={{
          marginTop: "1.2rem",
          border: "1px solid var(--border)",
          borderRadius: 10,
          background: "var(--bg-soft)",
          padding: "0.7rem 1rem",
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.82rem",
          color: "var(--text-dim)",
          display: "grid",
          gap: "0.25rem",
        }}
      >
        <div>
          data hash&nbsp;&nbsp;&nbsp;<span style={{ color: "var(--accent-2)", wordBreak: "break-all" }}>{a?.dataHash ?? "—"}</span>
        </div>
        <div>
          attestation&nbsp;&nbsp;<span style={{ color: "var(--text)" }}>{a?.contract ?? "CarbonTraceCredits"}</span>
        </div>
        <div>
          tx hash&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ wordBreak: "break-all" }}>{a?.txHash ?? "—"}</span>
        </div>
        <div>
          attested&nbsp;&nbsp;&nbsp;&nbsp;<span>{a?.attestedAt ? fmtDate(a.attestedAt) : "—"}</span>
        </div>
      </div>

      <div style={{ marginTop: "0.9rem", fontSize: "0.72rem", color: "var(--text-dim)" }}>
        This certificate is reproducible offline: re-run the claim through the verification engine
        and compare the data hash. On a live chain the same hash is stored immutably on Polygon Amoy.
      </div>
    </div>
  );

  return (
    <main className="page">
      <a href="/" className="muted" style={{ fontSize: "0.85rem" }}>
        ← Dashboard
      </a>

      <div style={{ marginTop: "1rem" }}>
        <CertificateActions
          fingerprint={a?.claimFingerprint ?? r.claimId}
          txHash={a?.txHash ?? ""}
          dataHash={a?.dataHash ?? ""}
        />
      </div>

      <div style={{ marginTop: "1.1rem" }}>{certificate}</div>

      {r.signalsBreakdown.length > 0 && (
        <div className="card" style={{ marginTop: "1.25rem" }}>
          <h2>Verification signals</h2>
          <ul className="reason-list">
            {r.signalsBreakdown.map((s) => (
              <li key={s.name}>
                <strong>[{s.name}]</strong> {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}