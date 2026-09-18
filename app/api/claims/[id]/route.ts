import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/storage";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const repo = getRepository();
  const record = await repo.getClaim(params.id);
  if (!record) return NextResponse.json({ ok: false, error: "Claim not found" }, { status: 404 });
  return NextResponse.json(
    {
      ok: true,
      // `result` matches the GET /api/claims list envelope; `claim` is kept
      // as an alias for the previous single-claim shape.
      result: record.result,
      claim: record.result,
      attestation: record.attestation,
      savedAt: record.savedAt,
    },
    { status: 200 },
  );
}
