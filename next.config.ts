import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // GitHub Pages needs a static export; Vercel uses the default (dynamic) build.
  ...(isGitHubPages ? { output: "export" as const } : {}),
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
