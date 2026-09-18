import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRepository } from "@/storage";
import { CLAIM_TYPE_LABELS } from "@/lib/api";
import { normalizeAgentId } from "@/lib/agent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team dashboard — CarbonTrace Lite",
};

const STATUS_BADGE: Record<string, string> = {
  verified: "badge badge-verified",
  partial: "badge badge-partial",
  flagged: "badge badge-flagged",
};

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

type StoredClaim = {
  id: string;
  claimType: string;
  quantity: number;
  unit: string;
  confidence: number;
  anomalyScore: number;
  status: "verified" | "partial" | "flagged";
  creditsAwarded: number;
  submittedAt: string;
};

export default async function AgentPage({ params }: { params: { agentRef: string } }) {
  const repo = getRepository();
  const agentRef = decodeURIComponent(params.agentRef);
  const normalized = normalizeAgentId(agentRef);

  const [user, claims] = await Promise.all([
    repo.getUser(normalized),
    repo.listClaims(500, 0),
  ]);
  if (!user) notFound();

  const mine: StoredClaim[] = claims
    .filter((c) => c.result.claim.agentRef === normalized)
    .sort((a, b) => b.result.createdAt.localeCompare(a.result.createdAt))
    .map((c) => ({
      id: c.result.claimId,
      claimType: c.result.claim.claimType,
      quantity: c.result.claim.quantity,
      unit: c.result.claim.unit,
      confidence: c.result.confidence,
      anomalyScore: c.result.anomalyScore,
      status: c.result.status,
      creditsAwarded: c.result.creditsAwarded,
      submittedAt: c.result.createdAt,
    }));

  const totalCredits = mine.reduce((s, c) => s + c.creditsAwarded, 0);
  const stat = (s: "verified" | "partial" | "flagged") => mine.filter((c) => c.status === s).length;

  return (
    <main className="page">
      <a href="/" className="muted" style={{ fontSize: "0.85rem" }}>
        ← Dashboard
      </a>

      <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginTop: "0.6rem" }}>
        <h1>{user.displayName}</h1>
        <span className="chip">{agentRef}</span>
      </div>
      <p className="subtitle">Team carbon ledger — verified and on-chain.</p>

      <div className="grid grid-stats">
        <div className="card stat">
          <div className="label">Credit balance</div>
          <div className="value" style={{ color: "var(--amber)" }}>
            {user.creditBalance} CTC
          </div>
        </div>
        <div className="card stat">
          <div className="label">Total earned</div>
          <div className="value">{totalCredits} CTC</div>
        </div>
        <div className="card stat">
          <div className="label">Claims</div>
          <div className="value">{mine.length}</div>
        </div>
        <div className="card stat">
          <div className="label">Split</div>
          <div className="value" style={{ fontSize: "1rem", paddingTop: "0.2rem" }}>
            <span style={{ color: "var(--verified)" }}>{stat("verified")} ✓</span> ·{" "}
            <span style={{ color: "var(--partial)" }}>{stat("partial")} ±</span> ·{" "}
            <span style={{ color: "var(--flagged)" }}>{stat("flagged")} ⚠</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2>Claim history</h2>
        {mine.length === 0 ? (
          <p className="muted">No claims submitted by this team yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Quantity</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Credits</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <a href={`/claims/${c.id}`}>
                        {CLAIM_TYPE_LABELS[c.claimType as keyof typeof CLAIM_TYPE_LABELS] ?? c.claimType}
                      </a>
                    </td>
                    <td>
                      {c.quantity} {c.unit}
                    </td>
                    <td>{Math.round(c.confidence * 100)}%</td>
                    <td>
                      <span className={STATUS_BADGE[c.status]}>{c.status}</span>
                    </td>
                    <td>{c.creditsAwarded > 0 ? `${c.creditsAwarded} CTC` : "—"}</td>
                    <td className="muted">{fmtDate(c.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}