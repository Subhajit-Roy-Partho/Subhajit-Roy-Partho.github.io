import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { ENABLE_DB, SITE_URL } from "@/lib/env";

export const metadata: Metadata = { title: "API Bank — Secret Vault" };

const codeCls =
  "overflow-x-auto rounded-xl border border-[var(--border)] bg-black/30 p-4 font-mono text-xs leading-relaxed whitespace-pre";

// On the static GitHub Pages mirror there is no backend, so every link that
// needs the live app points at the main site instead of a local route.
function LiveLink({
  path,
  children,
  className,
}: {
  path: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (ENABLE_DB) {
    return (
      <Link href={path} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={`${SITE_URL}${path}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children} <span aria-hidden>↗</span>
    </a>
  );
}

const steps = [
  {
    n: "01",
    title: "Sign in",
    body: "Email + password, GitHub, or Google. Turn on two-factor with any authenticator app after sign-up; sign-ins after that ask for a one-time code. Backup codes cover a lost phone.",
  },
  {
    n: "02",
    title: "Store secrets",
    body: "The /vault page saves name, value, allowed hosts, and how the secret is injected (header or body). The list only shows a masked preview — values are revealed on demand, in memory only.",
  },
  {
    n: "03",
    title: "Mint an API key",
    body: "The /keys page creates Bearer keys for scripts and services. The raw key is shown exactly once, at creation — after that only metadata is listed.",
  },
  {
    n: "04",
    title: "Call through the proxy",
    body: "POST /api/proxy/:id with a target URL. The server checks the host allowlist, injects the secret itself, and returns the upstream response — clients never see the value.",
  },
  {
    n: "05",
    title: "Drive it from a PC",
    body: "The site-vault CLI (node cli/vault.mjs, no dependencies) wraps the same API: login, list, get, push, push-env-file, delete, proxy. Credentials live at ~/.config/site-vault/config.json, mode 600.",
  },
  {
    n: "06",
    title: "Administer",
    body: "The admin board manages users and roles. The first admin is seeded server-side with scripts/seed-admin.mjs, reading VAULT_ADMIN_* strictly from the environment.",
  },
];

export default function ApiBankPage() {
  return (
    <div className="pt-32">
      {/* Hero */}
      <section className="container-page section pt-0">
        <Reveal className="max-w-3xl">
          <Link href="/extras" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
            ← All extras
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
            Extras · Self-hosted API bank
          </p>
          <h1 className="font-display mt-4 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-tight tracking-tight">
            API bank &amp; secret vault
          </h1>
          <p className="mt-6 text-base leading-relaxed text-[var(--muted)]">
            This site carries its own secret manager: per-user encrypted vault, Bearer API keys, a host-allowlisted
            proxy so third-party keys never touch client machines, a no-dependency PC CLI, and an admin board — all
            behind better-auth sign-in with free two-factor. This page documents the whole system.
          </p>
        </Reveal>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="chip">better-auth</span>
          <span className="chip">TOTP 2FA</span>
          <span className="chip">Encrypted at rest</span>
          <span className="chip">Bearer API keys</span>
          <span className="chip">Allowlisted proxy</span>
          <span className="chip">site-vault CLI</span>
        </div>

        {!ENABLE_DB && (
          <div className="card-surface mt-8 flex max-w-3xl flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">You&apos;re reading the static mirror.</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Sign-in, the vault, keys, and the admin board need the live backend — they run on the main site, not
                on this GitHub Pages copy.
              </p>
            </div>
            <a
              href={`${SITE_URL}/extras/apibank`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[#04121a] transition hover:brightness-110"
            >
              Open on the main site ↗
            </a>
          </div>
        )}
      </section>

      {/* How it fits together */}
      <section className="container-page section pt-0">
        <SectionHeading
          eyebrow="The tour"
          title="How the pieces fit"
          description="Six stops from first sign-in to automated calls from your own computer. Secrets are encrypted at rest and only ever unmasked on demand or inside the server-side proxy."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={(i % 3) * 0.06}>
              <div className="card-surface h-full p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">{s.n}</p>
                <h3 className="font-display mt-2 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Auth */}
      <section className="container-page section pt-0">
        <SectionHeading
          eyebrow="Sign-in & accounts"
          title="Auth with free two-factor"
          description="Email + password plus GitHub and Google OAuth, with TOTP two-factor that costs nothing — any authenticator app works."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="card-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">Methods</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--muted)]">
              <li>Email + password, or one click with GitHub / Google.</li>
              <li>
                Enroll two-factor <em>after</em> sign-up: scan the QR code with any authenticator app and save the
                backup codes somewhere safe.
              </li>
              <li>Later sign-ins ask for the six-digit code — an OTP challenge before the session is granted.</li>
              <li>Lost phone? A backup code gets you back in; then re-enroll.</li>
            </ul>
          </div>
          <div className="card-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">Admin board</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Admins get a board for user and role management. The very first admin is seeded server-side (see the
              seeding section below) — never through the UI, never with credentials in the repo.
            </p>
            <p className="mt-4 text-sm font-medium">
              <LiveLink path="/sign-in" className="text-[var(--foreground)] hover:text-[var(--accent)]">
                {ENABLE_DB ? "Open sign-in →" : "Open sign-in on the main site"}
              </LiveLink>
            </p>
          </div>
        </div>
      </section>

      {/* Vault */}
      <section className="container-page section pt-0">
        <SectionHeading
          eyebrow="The vault"
          title="Secrets, masked by default"
          description="The /vault page stores each secret with the metadata the proxy needs. The list never prints values — only a masked preview — until you explicitly reveal one."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="card-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">Creating a secret</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--muted)]">
              <li>
                <strong className="text-[var(--foreground)]">Name</strong> — e.g. <code>OPENAI_API_KEY</code>.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Value</strong> — encrypted before it rests in the
                database.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Allowed hosts</strong> — comma-separated
                (api.openai.com); required for proxying, and the proxy refuses anything else.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Inject as</strong> — <code>header</code> sends an
                Authorization Bearer header, <code>body</code> adds the secret to a JSON body field instead.
              </li>
            </ul>
          </div>
          <div className="card-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">Living with secrets</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--muted)]">
              <li>
                <strong className="text-[var(--foreground)]">Masked list</strong> — every row shows a preview, never
                the value.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Reveal on demand</strong> — one click fetches the
                plaintext into memory only; hide it when done.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Proxy test</strong> — each row has a built-in panel that
                fires a real request through <code>POST /api/proxy/:id</code> so you can verify a key without ever
                seeing it.
              </li>
            </ul>
            <p className="mt-4 text-sm font-medium">
              <LiveLink path="/vault" className="text-[var(--foreground)] hover:text-[var(--accent)]">
                {ENABLE_DB ? "Open the vault →" : "Open the vault on the main site"}
              </LiveLink>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              Duplicates are handled on demand only — nothing is checked on write. The /vault page&apos;s{" "}
              <em>Find duplicates</em> button (and <code>site-vault dedupe [--prune]</code>) scans for exact copies
              and near-matches server-side with masked previews only: <code>prune</code> deletes exact copies keeping
              the oldest, while near-matches are always merged manually via Edit/Delete and are never auto-deleted.
            </p>
          </div>
        </div>
      </section>

      {/* Keys */}
      <section className="container-page section pt-0">
        <SectionHeading
          eyebrow="Programmatic access"
          title="API keys carry a Bearer token"
          description="Keys created at /keys authenticate scripts and services against the vault and proxy APIs. The raw key appears exactly once — copy it, store it, and it is never shown again."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="card-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">Calling the API</p>
            <pre className={`${codeCls} mt-3`}>{`curl -H "Authorization: Bearer <key>" \\
  https://your-app.vercel.app/api/vault`}</pre>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Only key metadata is ever listed (name, id, created / last-used dates). Deleting a key immediately stops
              every caller using it.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Trust model: minting or deleting a key requires a signed-in browser session — Bearer keys can&apos;t mint
              or revoke keys. Keys do <em>not</em> trigger a two-factor challenge when they are used, so treat them like
              passwords. New keys expire after 90 days (1–365 days on request) and are usage-capped.
            </p>
            <p className="mt-4 text-sm font-medium">
              <LiveLink path="/keys" className="text-[var(--foreground)] hover:text-[var(--accent)]">
                {ENABLE_DB ? "Open API keys →" : "Open API keys on the main site"}
              </LiveLink>
            </p>
          </div>
          <div className="card-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
              Proxy without touching the secret
            </p>
            <pre className={`${codeCls} mt-3`}>{`curl -X POST \\
  -H "Authorization: Bearer <key>" \\
  -H "content-type: application/json" \\
  -d '{"url":"https://api.openai.com/v1/models","method":"GET"}' \\
  https://your-app.vercel.app/api/proxy/:id`}</pre>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The server checks the URL against the secret&apos;s allowed hosts, injects the value as a header or body
              field, and returns the upstream status, headers, and body.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Trusted-hosts warning: anyone able to call the proxy can make the server send the secret to <em>any</em>{" "}
              allowlisted host — only allowlist hosts you trust with the value. Targets must be public https hosts on
              the default port (no credentials in the URL); private, loopback, link-local, and other reserved ranges
              are rejected after DNS resolution, and the resolution is re-checked after the call.
            </p>
          </div>
        </div>
      </section>

      {/* CLI */}
      <section className="container-page section pt-0">
        <SectionHeading
          eyebrow="From your computer"
          title="The site-vault CLI"
          description="A plain-node companion (zero dependencies) with the same power as the web UI. Run it in place or link it onto your PATH — values stay masked unless you explicitly ask to reveal one."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="card-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">Setup & everyday use</p>
            <pre className={`${codeCls} mt-3`}>{`# run in place, or link it onto PATH
node cli/vault.mjs --help
npm link
site-vault --help

# log in (one authenticated round-trip, then saved)
# --api-key-stdin / --api-key-env avoid leaving the key in shell history
printf '%s' "$SITE_VAULT_KEY" | site-vault login --url https://example.com --api-key-stdin
site-vault login --url https://example.com --api-key-env SITE_VAULT_KEY

# list and read (masked previews only)
site-vault list
site-vault get OPENAI_API_KEY
site-vault get OPENAI_API_KEY --reveal  # raw value on stdout

# delete
site-vault delete OLD_KEY`}</pre>
          </div>
          <div className="card-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
              Pushing & proxying
            </p>
            <pre className={`${codeCls} mt-3`}>{`# push (upsert: creates, or updates on name conflict)
printf '%s' "$OPENAI_API_KEY" | \\
  site-vault push OPENAI_API_KEY --value-stdin --hosts api.openai.com
site-vault push STRIPE_KEY --env-key STRIPE_SECRET --inject header

# bulk import from an env file (names only are ever printed)
site-vault push-env-file .env.local --all
site-vault push-env-file .env.local --prefix OPENAI_
site-vault push-env-file .env.local --allowlist STRIPE_SECRET,OPENAI_API_KEY

# proxy: secret is injected server-side, never touches this machine
site-vault proxy OPENAI_API_KEY --url https://api.openai.com/v1/models`}</pre>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Login details are stored at <code>~/.config/site-vault/config.json</code> with mode{" "}
              <code>600</code> — readable only by you. Prefer <code>--api-key-stdin</code> or{" "}
              <code>--api-key-env</code> over <code>--api-key</code>, which can linger in shell history. Proxy calls
              carry the same trusted-hosts rule as the web UI: the server will send the secret to any allowlisted host.
            </p>
          </div>
        </div>
      </section>

      {/* Admin seed */}
      <section className="container-page section pt-0">
        <SectionHeading
          eyebrow="Operations"
          title="Seeding the first admin"
          description="scripts/seed-admin.mjs creates the admin through the better-auth API and sets role = admin. It reads strictly from the environment and refuses to run unless all three variables are set."
        />
        <div className="mt-8">
          <div className="card-surface p-5">
            <pre className={codeCls}>{`export VAULT_ADMIN_EMAIL='admin@example.com'
export VAULT_ADMIN_NAME='Site Admin'
export VAULT_ADMIN_PASSWORD='<strong-random-password>'
# plus the app's own server vars: BETTER_AUTH_SECRET, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
node scripts/seed-admin.mjs`}</pre>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Never argv, never hardcoded, nothing in the repo. Full details live in{" "}
              <code>cli/README.md</code> next to the CLI docs.
            </p>
          </div>
        </div>
      </section>

      {/* Try it live */}
      <section className="container-page section pt-0">
        <div className="card-surface flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">
              {ENABLE_DB ? "Try it live." : "Try it on the main site."}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {ENABLE_DB
                ? "Sign in, store a secret, mint a key, and proxy your first call."
                : "This mirror is static — the vault, keys, and admin board run on the live deployment."}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <LiveLink
              path="/vault"
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[#04121a] transition hover:brightness-110"
            >
              {ENABLE_DB ? "Open vault →" : "Vault"}
            </LiveLink>
            <LiveLink
              path="/keys"
              className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium hover:text-[var(--accent)]"
            >
              {ENABLE_DB ? "API keys →" : "Keys"}
            </LiveLink>
          </div>
        </div>
      </section>
    </div>
  );
}
