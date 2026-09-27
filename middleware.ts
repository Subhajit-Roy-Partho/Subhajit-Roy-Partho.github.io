// Canonical-host redirect: the legacy Vercel alias serves the full app,
// but session cookies are host-only — crossing between hosts reads as
// "signed out on navigation". Send every legacy-host request to the
// canonical domain, preserving path+query (308 preserves method+body,
// so API calls survive too). Both hosts stay in trustedOrigins.
// NOTE: incompatible with `output:"export"` — the Pages workflow strips
// this file before the static build (see .github/workflows/deploy.yml).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LEGACY_HOST =
  "subhajit-roy-partho-github-io-subhajit-roys-projects.vercel.app";
const CANONICAL = "https://subhajit-roy.vercel.app";

export function middleware(req: NextRequest) {
  if (req.nextUrl.hostname === LEGACY_HOST) {
    const url = new URL(req.nextUrl.pathname + req.nextUrl.search, CANONICAL);
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
