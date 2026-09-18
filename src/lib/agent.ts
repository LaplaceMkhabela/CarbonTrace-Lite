/**
 * Canonical user / agent identifier.
 *
 * Friendly refs like "School @ Greenfield" are normalised to a stable,
 * URL-safe ledger id (`user:school-greenfield`). All storage and attestation
 * uses the canonical id; UIs may display the friendly form.
 *
 * Idempotent: passing an already-canonical id (`user:…`) returns it
 * unchanged instead of double-prefixing (`user:user-…`).
 */
export function normalizeAgentId(agentRef?: string): string {
  const ref = (agentRef ?? "").trim();
  if (!ref) return "user:community";
  const withoutPrefix = ref.toLowerCase().startsWith("user:") ? ref.slice("user:".length) : ref;
  const slug = withoutPrefix.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `user:${slug || "anonymous"}`;
}