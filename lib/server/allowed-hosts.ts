// Shared allowedHosts normalization for the vault API.
//
// POST and PATCH must agree exactly: entries are trimmed + lowercased so
// the proxy's exact-match check can't be bypassed by cosmetic variants
// ("API.Example.com " vs "api.example.com"). null means proxy disabled.
import "server-only";

export function parseAllowedHosts(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) throw new Error("allowedHosts must be an array");
  if (raw.length > 10) throw new Error("allowedHosts max 10 entries");
  return raw.map((h) => {
    if (typeof h !== "string" || !h.trim()) {
      throw new Error("allowedHosts entries must be non-empty strings");
    }
    return h.trim().toLowerCase();
  });
}
