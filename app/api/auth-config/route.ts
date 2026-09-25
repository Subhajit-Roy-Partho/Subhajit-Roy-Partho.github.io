// GET /api/auth-config — which social providers are actually configured.
// Lets the sign-in UI (L2) hide buttons that could never work instead of
// showing broken OAuth entries when env creds are unset.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    github: Boolean(
      process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ),
    google: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
  });
}
