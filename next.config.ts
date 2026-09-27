import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // GitHub Pages needs a static export; Vercel uses the default (dynamic) build.
  ...(isGitHubPages ? { output: "export" as const } : {}),
  images: { unoptimized: true },
  trailingSlash: true,
  // Tree-shake the framer-motion barrel import down to the modules each route
  // actually uses — smaller shared chunk, no visual or API change.
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
};

export default nextConfig;
