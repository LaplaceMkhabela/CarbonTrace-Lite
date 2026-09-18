import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/storage";
import { normalizeAgentId } from "@/lib/agent";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { agentRef: string } }) {
  const repo = getRepository();
  const raw = decodeURIComponent(params.agentRef);
  // Accept either a canonical ledger id ("user:school-greenfield") or the
  // friendly form ("School @ Greenfield" → normalised on lookup).
  const candidates = [raw.trim(), normalizeAgentId(raw)].filter((v, i, arr) => arr.indexOf(v) === i);

  let user = null;
  let id = "";
  for (const candidate of candidates) {
    user = await repo.getUser(candidate);
    if (user) {
      id = candidate;
      break;
    }
  }
  if (!user) {
    return NextResponse.json({ ok: false, error: `No user for '${raw}'` }, { status: 404 });
  }

  const claims = await repo.listClaims(1000, 0);
  const credits = await repo.listCreditsByUser(id);
  const userClaims = claims.filter((c) => c.result.claim.agentRef === id);

  return NextResponse.json(
    {
      ok: true,
      user,
      credits,
      claims: userClaims.map((c) => ({
        claimId: c.result.claimId,
        claimType: c.result.claim.claimType,
        quantity: c.result.claim.quantity,
        unit: c.result.claim.unit,
        confidence: c.result.confidence,
        status: c.result.status,
        creditsAwarded: c.result.creditsAwarded,
        createdAt: c.result.createdAt,
        attestation: c.attestation,
      })),
      stats: await repo.getStats(),
    },
    { status: 200 },
  );
}