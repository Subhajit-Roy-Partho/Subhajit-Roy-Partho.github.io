import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { profile } from "@/data/site";

const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });
const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(profile.links.portfolio),
  title: {
    default: "Subhajit Roy — Computational Biophysicist",
    template: "%s — Subhajit Roy",
  },
  description: profile.summary,
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Subhajit Roy — Computational Biophysicist",
    description: profile.summary,
    url: profile.links.portfolio,
    siteName: "Subhajit Roy",
    type: "website",
  },
};

const THEME_INIT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="noise min-h-screen antialiased" suppressHydrationWarning>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
