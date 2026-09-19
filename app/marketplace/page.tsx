"use client";

import { useEffect, useState } from "react";
import { fetchUser, type ApiUser } from "@/lib/api";

/*
 * Points marketplace — the community layer's incentive loop. CTC credits earned
 * by verified claims are redeemed for local rewards. Redemptions are tracked
 * locally for the demo; on a live deployment they would settle through the
 * ledger partner programme.
 */

interface Reward {
  id: string;
  name: string;
  note: string;
  cost: number;
  color: string;
}

const REWARDS: Reward[] = [
  { id: "sapling", name: "Tree sapling", note: "1 native sapling for your garden or school yard", cost: 5, color: "#34d399" },
  { id: "compost", name: "Compost bin", note: "Household compost bin to continue the loop", cost: 15, color: "#a3e635" },
  { id: "tools", name: "Garden tools voucher", note: "Voucher at the local hardware cooperative", cost: 20, color: "#38bdf8" },
  { id: "market", name: "Market discount", note: "10% off at the weekly village market", cost: 30, color: "#fbbf24" },
  { id: "school", name: "School garden starter kit", note: "Seeds, beds and a workshop for a class", cost: 40, color: "#c084fc" },
  { id: "pond", name: "Community pond restock", note: "Native fish + plants for the restored wetland", cost: 50, color: "#60a5fa" },
];

const STORE_KEY = (ref: string) => `ct-redemptions-${ref}`;

interface Redemption {
  id: string;
  rewardId: string;
  cost: number;
  redeemedAt: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export default function Marketplace() {
  const [agentRef, setAgentRef] = useState("school@greenfield");
  const [user, setUser] = useState<ApiUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [spent, setSpent] = useState(0);

  async function load() {
    const ref = agentRef.trim();
    if (!ref) {
      setError("Enter a team reference first (e.g. school@greenfield).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUser(ref);
      if (!res.ok) {
        setUser(null);
        setError(`No team found for '${ref}'. Submit a claim first so the team exists in the ledger.`);
        return;
      }
      setUser(res);
      const saved: Redemption[] = JSON.parse(localStorage.getItem(STORE_KEY(ref)) ?? "[]");
      setRedemptions(saved);
      setSpent(saved.reduce((s: number, r: Redemption) => s + r.cost, 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function redeem(reward: Reward) {
    if (!user) return;
    const balance = user.user.creditBalance - spent;
    if (balance < reward.cost) return;
    const entry: Redemption = {
      id: `red-${Date.now()}`,
      rewardId: reward.id,
      cost: reward.cost,
      redeemedAt: new Date().toISOString(),
    };
    const next = [...redemptions, entry];
    setRedemptions(next);
    setSpent(spent + reward.cost);
    localStorage.setItem(STORE_KEY(agentRef.trim()), JSON.stringify(next));
  }

  const available = user ? Math.max(0, user.user.creditBalance - spent) : 0;

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            Incentive loop · CTC credits
          </div>
          <h1>Community marketplace</h1>
          <p className="subtitle" style={{ margin: 0, maxWidth: "42rem" }}>
            Redeem verified credits for real local rewards — saplings, tools, market discounts. Every
            credit here was earned through a claim that passed independent verification.
          </p>
        </div>
      </section>

      <section className="card" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <label className="field" style={{ flex: 1, minWidth: 220 }}>
          Team / agent reference
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={agentRef}
              onChange={(e) => setAgentRef(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              placeholder="school@greenfield"
            />
            <button className="btn btn-ghost" onClick={() => void load()} disabled={loading}>
              {loading ? "Loading…" : "Load team"}
            </button>
          </div>
        </label>

        {user && (
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "baseline" }}>
            <div>
              <div className="muted" style={{ fontSize: "0.74rem", textTransform: "uppercase" }}>
                {user.user.displayName} — redeemable
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--amber)" }} className="metric-value tnum">
                {available} CTC
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: "0.74rem", textTransform: "uppercase" }}>
                Redeemed this month
              </div>
              <div className="metric-value tnum" style={{ fontSize: "1.5rem" }}>{spent} CTC</div>
            </div>
          </div>
        )}
      </section>

      {error && (
        <p style={{ color: "var(--flagged)", fontSize: "0.9rem", marginTop: "1rem" }}>{error}</p>
      )}

      <div className="grid grid-stats" style={{ marginTop: "1.5rem" }}>
        {REWARDS.map((rw) => {
          const affordable = user !== null && available >= rw.cost;
          return (
            <div key={rw.id} className="card stat" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: rw.color }}>{rw.name}</div>
              <div className="muted" style={{ fontSize: "0.82rem", minHeight: "2.6em" }}>
                {rw.note}
              </div>
              <div className="metric-value tnum" style={{ fontSize: "1.15rem" }}>{rw.cost} CTC</div>
              <button
                className={affordable ? "btn" : "btn btn-ghost"}
                disabled={!affordable}
                onClick={() => redeem(rw)}
              >
                {user ? (affordable ? "Redeem" : `Need ${rw.cost - available} more`) : "Load a team first"}
              </button>
            </div>
          );
        })}
      </div>

      {redemptions.length > 0 && (
        <section className="card" style={{ marginTop: "1.5rem" }}>
          <h2>Recent redemptions</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reward</th>
                  <th>Cost</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {redemptions
                  .slice()
                  .reverse()
                  .map((rd) => {
                    const rw = REWARDS.find((r) => r.id === rd.rewardId);
                    return (
                      <tr key={rd.id}>
                        <td style={{ color: rw?.color ?? "var(--text)" }}>{rw?.name ?? rd.rewardId}</td>
                        <td>{rd.cost} CTC</td>
                        <td className="muted">{fmtDate(rd.redeemedAt)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
        Demo note: redemption requests are tracked on-device for the demo. In production they would
        be submitted to the ledger and settled through a local partner-cooperative programme.
      </p>
    </main>
  );
}