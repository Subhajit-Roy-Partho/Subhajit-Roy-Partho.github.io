import { SITE_URL } from "@/lib/env";
import { AccountHeader, Card } from "@/components/account-ui";

// Shown on the static GitHub Pages mirror where no backend exists.
// Server-safe: only reads public env constants, never touches auth/db.
export function DbPlaceholder({
  feature,
  path,
}: {
  feature: string;
  path: string;
}) {
  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <AccountHeader
          eyebrow={feature}
          title="Available on the main site."
          lede="This interactive area needs a live backend. The GitHub Pages mirror you're reading now is a static copy."
        />
        <Card className="mx-auto mt-10 max-w-lg text-center">
          <p className="chip mx-auto">Static mirror</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            Sign-in, the secret vault, API keys, and the admin board all run
            on the main site.
          </p>
          <a
            href={`${SITE_URL}${path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[#04121a] transition hover:brightness-110"
          >
            Open {feature} on the main site <span aria-hidden>→</span>
          </a>
        </Card>
      </section>
    </div>
  );
}
