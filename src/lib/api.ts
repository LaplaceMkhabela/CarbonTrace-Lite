export type ClaimStatus = "verified" | "partial" | "flagged";

export interface ApiAttestation {
  dataHash: string;
  claimFingerprint: string;
  network: string;
  contract: string;
  txHash: string;
  confidence: number;
  attestedAt: string;
  blockNumber?: number;
}

export interface ApiClaim {
  claimId: string;
  claimType: ClaimType;
  lat: number;
  lon: number;
  quantity: number;
  unit: string;
  activityDate?: string;
  agentRef?: string;
  note?: string;
  confidence: number;
  anomalyScore: number;
  status: ClaimStatus;
  multiplier: number;
  creditsAwarded: number;
  createdAt: string;
  signals?: {
    provider: { ndvi: string; ndwi: string; weather: string };
  };
  signalsBreakdown?: Array<{ name: string; value: number; reason: string }>;
}

export type ClaimType =
  | "tree-planted"
  | "composting"
  | "recycling"
  | "energy-saved"
  | "wetland-restoration";

export const CLAIM_TYPES: ClaimType[] = [
  "tree-planted",
  "composting",
  "recycling",
  "energy-saved",
  "wetland-restoration",
];

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  "tree-planted": "Tree planted",
  composting: "Composting",
  recycling: "Recycling",
  "energy-saved": "Energy saved",
  "wetland-restoration": "Wetland restoration",
};

export const DEFAULT_UNIT: Partial<Record<ClaimType, string>> = {
  "tree-planted": "trees",
  composting: "kg",
  recycling: "kg",
  "energy-saved": "kWh",
  "wetland-restoration": "m²",
};

export interface ApiStats {
  totalClaims: number;
  verifiedClaims: number;
  flaggedClaims: number;
  totalCreditsAwarded: number;
}

export interface ClaimsResponse {
  ok: boolean;
  claims: Array<{ result: ApiClaim; attestation: ApiAttestation | null }>;
  count: number;
  stats: ApiStats;
}

export interface VerifyResponse {
  ok: boolean;
  result: ApiClaim;
  attestation: ApiAttestation;
  owner: { id: string; displayName: string };
  credits: number;
  stats: ApiStats;
  chainMode: string;
  error?: string;
}

export interface AgentDashboard {
  user: {
    id: string;
    displayName: string;
    locationLabel?: string;
    creditBalance: number;
    createdAt: string;
  };
  totalCredits: number;
  claimCount: number;
  verifiedCount: number;
  partialCount: number;
  flaggedCount: number;
  claims: ApiClaim[];
}

export interface ApiUser {
  ok: boolean;
  user: AgentDashboard["user"];
  credits: Array<{
    id: string;
    claimId: string;
    amount: number;
    status: ClaimStatus;
    createdAt: string;
    attestationTxHash?: string;
  }>;
  claims: Array<{
    claimId: string;
    claimType: ClaimType;
    quantity: number;
    unit: string;
    confidence: number;
    status: ClaimStatus;
    creditsAwarded: number;
    createdAt: string;
    attestation: ApiAttestation | null;
  }>;
}

import { normalizeAgentId } from "@/lib/agent";

export async function fetchClaims(): Promise<ClaimsResponse> {
  const res = await fetch("/api/claims?limit=100&includeSignals=1", {
    cache: "no-store",
  });
  return (await res.json()) as ClaimsResponse;
}

export async function fetchUser(agentRef: string): Promise<ApiUser> {
  const res = await fetch(`/api/users/${encodeURIComponent(normalizeAgentId(agentRef))}`, {
    cache: "no-store",
  });
  return (await res.json()) as ApiUser;
}

export async function submitVerify(payload: unknown): Promise<VerifyResponse> {
  const res = await fetch("/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (await res.json()) as VerifyResponse;
}

export function shortHash(h: string): string {
  if (!h) return "";
  const clean = h.replace(/^0x/, "");
  return `${clean.slice(0, 10)}…${clean.slice(-6)}`;
}