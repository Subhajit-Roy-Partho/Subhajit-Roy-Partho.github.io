// Size-limited JSON body parsing for API routes.
//
// `await req.json()` buffers without bound, so a caller can force the
// server to allocate arbitrarily large strings (body/header DoS). These
// helpers enforce a byte cap: a Content-Length pre-check for the cheap
// reject, plus a streaming read that aborts past the cap for clients that
// omit or lie about the length.
import "server-only";

export class BodyTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`body too large (max ${maxBytes} bytes)`);
  }
}

export async function readBodyTextLimited(
  req: Request,
  maxBytes: number
): Promise<string> {
  const len = req.headers.get("content-length");
  if (len !== null) {
    const n = Number(len);
    if (!Number.isFinite(n) || n < 0) throw new Error("bad content-length");
    if (n > maxBytes) throw new BodyTooLargeError(maxBytes);
  }
  if (!req.body) {
    // No stream (e.g. already-buffered test requests): fall back to the
    // pre-checked whole read.
    const text = await req.text();
    if (text.length > maxBytes) throw new BodyTooLargeError(maxBytes);
    return text;
  }
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        // best effort; we already have what we need (an error)
      }
      throw new BodyTooLargeError(maxBytes);
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    merged.set(c, off);
    off += c.byteLength;
  }
  return new TextDecoder().decode(merged);
}

/** Parse a JSON object body capped at maxBytes. Throws BodyTooLargeError
 *  past the cap, Error("invalid json") when unparsable. */
export async function readJsonLimited(
  req: Request,
  maxBytes: number
): Promise<Record<string, unknown>> {
  let text: string;
  try {
    text = await readBodyTextLimited(req, maxBytes);
  } catch (e) {
    if (e instanceof BodyTooLargeError) throw e;
    throw new Error("invalid body");
  }
  if (!text) throw new Error("invalid json");
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid json");
    }
    return parsed as Record<string, unknown>;
  } catch (e) {
    if (e instanceof BodyTooLargeError) throw e;
    throw new Error("invalid json");
  }
}
