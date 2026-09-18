import { NextRequest, NextResponse } from "next/server";
import { verifyClaim, type VerifyOptions } from "@/verification/engine";
import { attestResult, attestationMode } from "@/onchain/attestation";
import { getRepository } from "@/storage";
import type { Attestation, ClaimRecord } from "@/storage/types";
import { CLAIM_TYPE_LABELS, type Claim, type Credit, type User } from "@/types/claim";
import { normalizeAgentId } from "@/lib/agent";

export const runtime = "nodejs";

async function resolveUser(agentRef?: string): Promise<User> {
  const repo = getRepository();
  const ownerId = normalizeAgentId(agentRef);
  const existing = await repo.getUser(ownerId);
  if (existing) return existing;
  const user: User = {
    id: ownerId,
    displayName: agentRef && agentRef.trim() ? agentRef.trim() : "Community pool",
    creditBalance: 0,
    createdAt: new Date().toISOString(),
  };
  await repo.saveUser(user);
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Optional options carried in the request envelope.
    const envelope = body?.claim && typeof body.claim === "object" ? body : { claim: body };
    const { claim: rawClaim, useModel } = envelope;
    const ownerRef = envelope.agentRef ?? rawClaim?.agentRef;

    const repo = getRepository();
    const owner = await resolveUser(ownerRef);

    // Bind the claim to the resolved owner before hashing/verification so the
    // owner id is part of the attested hash.
    const claimInput = {
      ...rawClaim,
      agentRef: owner.id,
      note: envelope.note ?? rawClaim?.note,
    };
    const options: VerifyOptions = { useModel: typeof useModel === "boolean" ? useModel : undefined };
    const result = await verifyClaim(claimInput, options);

    const attestation: Attestation = await attestResult(result);

    const record: ClaimRecord = {
      result,
      attestation,
      savedAt: new Date().toISOString(),
    };
    await repo.saveClaim(record);

    // Award credits to the ledger when the claim earned any.
    if (result.creditsAwarded > 0) {
      const credit: Credit = {
        id: `credit:${result.claimId}`,
        claimId: result.claimId,
        ownerRef: owner.id,
        amount: result.creditsAwarded,
        confidence: result.confidence,
        status: result.status,
        createdAt: result.createdAt,
        attestationTxHash: attestation.txHash,
      };
      await repo.recordCredit(credit);
    }

    const stats = await repo.getStats();

    return NextResponse.json(
      {
        ok: true,
        result,
        attestation,
        owner,
        credits: result.creditsAwarded,
        stats,
        chainMode: attestationMode(),
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message, hint: "Expected: { claim: { claimType, lat, lon, quantity, unit }, agentRef?, useModel? }" },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "CarbonTrace Lite verification engine",
    claimTypes: CLAIM_TYPE_LABELS,
    usage:
      "POST /api/verify with { claim: { claimType, lat, lon, quantity, unit, activityDate? }, agentRef?, useModel? }",
  });
}