import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";
import { rateLimited } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = toNextJsHandler(auth);

type HandlerReq = Parameters<typeof handler.GET>[0];

// M4: per-IP rate limit plus a request-body cap in front of better-auth's
// auth endpoints (credential stuffing / body-DoS containment). better-auth
// parses its own bodies internally, so the cap here is a Content-Length
// pre-check; vault/proxy/keys routes use streaming capped reads instead
// (see lib/server/body-limit.ts).
function guarded(
  fn: (req: HandlerReq) => Promise<Response>
): (req: HandlerReq) => Promise<Response> {
  return async (req: HandlerReq): Promise<Response> => {
    const limited = rateLimited(req, "auth");
    if (limited) return limited;
    const len = req.headers.get("content-length");
    if (len !== null && Number(len) > 65_536) {
      return Response.json({ error: "body too large" }, { status: 413 });
    }
    return fn(req);
  };
}

export const GET = guarded((req) => handler.GET(req));
export const POST = guarded((req) => handler.POST(req));
