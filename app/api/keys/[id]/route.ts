import { auth } from "@/lib/auth";
import { resolveUserId, unauthorized } from "@/lib/server/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Api = Record<string, (...args: never[]) => Promise<unknown>>;

// DELETE /api/keys/:id — delete caller's key by key id.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
  const { id } = await params;
  try {
    const api = auth.api as unknown as Api;
    const fn = api.deleteApiKey ?? api.deleteApiKeys;
    if (typeof fn === "function") {
      await fn({ headers: req.headers, body: { keyId: id } } as never);
      return Response.json({ ok: true });
    }
    return Response.json(
      { error: "apiKey plugin delete unavailable" },
      { status: 501 }
    );
  } catch {
    return Response.json({ error: "delete failed" }, { status: 500 });
  }
}
