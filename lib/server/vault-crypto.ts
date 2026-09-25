// AES-256-GCM vault crypto. Server-only: decrypt must never run client-side.
import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function getKey(): Buffer {
  const b64 = process.env.VAULT_ENCRYPTION_KEY_B64;
  if (!b64) {
    // Allow route collection at build time; runtime calls fail loud.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return Buffer.alloc(32, 0);
    }
    throw new Error(
      "Missing VAULT_ENCRYPTION_KEY_B64 (32 bytes, base64). See .env.example."
    );
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("VAULT_ENCRYPTION_KEY_B64 must decode to exactly 32 bytes.");
  }
  return key;
}

/** Encrypt plaintext. Returns envelope "iv:tag:ct" with all parts base64. */
export function encryptSecret(
  plaintext: string,
  keyVersion = 1
): { ciphertext: string; iv: string; keyVersion: number } {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    ciphertext: `${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`,
    keyVersion,
  };
}

/** Decrypt an envelope produced by encryptSecret. Server-side only. */
export function decryptSecret(envelope: string): string {
  const key = getKey();
  const [ivB64, tagB64, ctB64] = envelope.split(":");
  if (!ivB64 || !tagB64 || !ctB64) {
    throw new Error("Malformed ciphertext envelope.");
  }
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return (
    decipher.update(Buffer.from(ctB64, "base64")).toString("utf8") +
    decipher.final("utf8")
  );
}

/** Masked preview for non-owner reads / list views. Never leaks plaintext. */
export function maskPreview(envelope: string): string {
  void envelope;
  return "••••••••";
}
