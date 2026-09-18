import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));
  const offset = Number(searchParams.get("offset") ?? 0);
  const claimType = searchParams.get("claimType") ?? undefined;
  const includeSignals = searchParams.get("includeSignals") === "1";

  const repo = getRepository();
  const claims = await repo.listClaims(limit, offset, claimType);
  const stats = await repo.getStats();

  const payload = claims.map((c) => ({
    result: {
      ...c.result,
      signals: includeSignals ? c.result.signals : undefined,
      signalsRaw: undefined,
    },
    attestation: c.attestation,
  }));

  return NextResponse.json({ ok: true, claims: payload, count: payload.length, stats }, { status: 200 });
}