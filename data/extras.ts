export type ExtraLink = { label: string; href: string };

export type Extra = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  status: string;
  /** Internal route (e.g. /extras/...) or external URL */
  href: string;
  /** True when the link leaves this site */
  external?: boolean;
  liveLink?: ExtraLink;
  repoLink?: ExtraLink;
  comingSoon?: boolean;
};

export const extras: Extra[] = [
  {
    id: "electrostatic-simulator",
    name: "Electrostatic Field Simulator",
    tagline: "A virtual conductive-paper sheet for PHY 151",
    description:
      "Place a charged disc and a grounded bar on the paper and the page solves Laplace's equation over the whole sheet. Explore equipotentials, follow field lines, and check right angles the way you would with the four-point probe in the lab.",
    tags: ["Next.js", "TypeScript", "Multigrid + CG", "Physics teaching"],
    status: "Live · interactive",
    href: "/extras/electrostatic-simulator",
    liveLink: { label: "Open the simulator", href: "/extras/electrostatic-simulator" },
  },
  {
    id: "khagna",
    name: "Khagna",
    tagline: "Best price & best card",
    description:
      "Item-first grocery price comparison (English + Bengali names) with per-unit normalization, city + radius + map search, store-vs-online prices, a multi-item basket optimizer, and ranked credit-card recommendations. Manual prices plus a server scraper keep listings fresh.",
    tags: ["Next.js", "Leaflet / OSM", "Turso", "Cloudinary"],
    status: "Coming soon",
    href: "https://subhajit-roy-partho.github.io/Khagna",
    external: true,
    comingSoon: true,
    liveLink: { label: "Khagna (launching soon)", href: "https://subhajit-roy-partho.github.io/Khagna" },
  },
  {
    id: "dhar",
    name: "Dhar",
    tagline: "Shared expense tracker — a Splitwise successor",
    description:
      "Free, open-source expense-sharing app. Create groups, add participants, split bills evenly / by shares / by percentage / by exact amounts, track balances, record reimbursements, itemize bills, and scan receipts with AI. Works offline as a PWA in 20+ languages.",
    tags: ["Next.js 16", "Auth.js", "PostgreSQL / Prisma", "tRPC"],
    status: "Live",
    href: "https://dhar.vercel.app/",
    external: true,
    liveLink: { label: "Open Dhar live", href: "https://dhar.vercel.app/" },
    repoLink: { label: "Source on GitHub", href: "https://github.com/Subhajit-Roy-Partho/spliit" },
  },
];
