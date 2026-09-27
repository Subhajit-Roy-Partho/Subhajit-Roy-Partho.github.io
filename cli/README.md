# site-vault CLI

PC companion for the per-user vault API (`POST`/`GET /api/vault`,
`GET`/`PATCH`/`DELETE /api/vault/:id`, `POST /api/proxy/:secretId`).
No npm dependencies — plain `node` (global `fetch`).

## Install

```sh
# run in place
node cli/vault.mjs --help

# or link it onto PATH
npm link
site-vault --help
```

(`package.json` exposes `bin: { "site-vault": "cli/vault.mjs" }`.)

## Get an API key

1. Sign in to the site (email+password, GitHub, or Google).
2. Open the **/keys** page and create a key.
3. Log the CLI in (validates with one authenticated round-trip, then stores
   `~/.config/site-vault/config.json`, mode `600`):

```sh
# stdin / env first — a key passed as --api-key can linger in shell history
printf '%s' "$SITE_VAULT_KEY" | site-vault login --url https://example.com --api-key-stdin
site-vault login --url https://example.com --api-key-env SITE_VAULT_KEY
# last resort (prints a history warning):
site-vault login --url https://example.com --api-key <key>
```

## Minting a key from the CLI

`mint` signs in with email+password (session cookie kept in memory only),
then creates the key — the only CLI path that can mint, because the server
requires a signed-in session and Bearer keys can't mint keys by design
(no privilege-escalation loop). The password comes from stdin only
(never an argv flag, never stored); the raw key prints ONCE to stdout.
Nothing is written to the config unless you pass `--save`.

```sh
# password via stdin; --url falls back to the saved login's site if omitted
printf '%s' "$VAULT_PW" | site-vault mint --url https://example.com --email you@example.com --name laptop-script --days 90
# two-factor accounts: add the six-digit authenticator code
printf '%s' "$VAULT_PW" | site-vault mint --email you@example.com --otp 123456
# store the fresh key as this machine's login (otherwise: save the printed key yourself)
printf '%s' "$VAULT_PW" | site-vault mint --email you@example.com --save
```

Without `--otp` on a 2FA account, `mint` exits `2` and tells you to re-run
with `--otp`. `--days` clamps to 1–365 (server default 90 when omitted).

## Usage

Secrets are never printed — `list`/`get` show the server's masked preview
only. The one exception is `get --reveal`, which writes the raw value to
stdout (pipe it, don't screenshot it).

```sh
site-vault list
site-vault get OPENAI_API_KEY            # metadata + masked preview
site-vault get OPENAI_API_KEY --reveal   # raw value on stdout

# push (upsert: creates, or updates on name conflict)
printf '%s' "$OPENAI_API_KEY" | site-vault push OPENAI_API_KEY --value-stdin --hosts api.openai.com
site-vault push STRIPE_KEY --env-key STRIPE_SECRET --inject header
site-vault push FLAG --value dev-only   # prefer stdin/env; --value can linger in history
site-vault push OPENAI_API_KEY --value-stdin --description "OpenAI key for completions demo"  # optional note (max 500 chars), shown by get

# delete
site-vault delete OLD_KEY

# dedupe (on-demand only — never runs on write)
site-vault dedupe          # scan: exact groups + near-match warnings (masked previews only)
site-vault dedupe --prune  # delete exact copies only (oldest kept); near-matches still merge-manually

# proxy: secret is injected server-side, never touches this machine.
# Trusted-hosts warning: the server will send the secret to ANY of the
# secret's allowed hosts — only allowlist hosts you trust with the value.
site-vault proxy OPENAI_API_KEY --url https://api.openai.com/v1/models
site-vault proxy MY_API --url https://api.example.com/submit --method POST --body-json '{"q":1}'
```

## Bulk import from an env file

Review names first (never cat values to a terminal you share):

```sh
grep -E '^[A-Z_]+=' ~/.zshrc | cut -d= -f1
grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env.local | cut -d= -f1
```

Then push by selection. `KEY=VALUE` lines only; comments, `export`
prefixes, and malformed lines are skipped. Values are never printed —
only names plus created/updated counts:

```sh
# everything (explicit opt-in)
site-vault push-env-file .env.local --all

# only keys with a prefix
site-vault push-env-file .env.local --prefix OPENAI_

# only named keys
site-vault push-env-file .env.local --allowlist STRIPE_SECRET,OPENAI_API_KEY
```

## Seeding the first admin (server-side)

`scripts/seed-admin.mjs` creates the admin via the better-auth API and sets
`role = admin`. It reads strictly from the environment and refuses to run
unless all three are set — never argv, never hardcoded, nothing in the repo:

```sh
export VAULT_ADMIN_EMAIL='admin@example.com'
export VAULT_ADMIN_NAME='Site Admin'
export VAULT_ADMIN_PASSWORD='<strong-random-password>'
# plus the app's own server vars: BETTER_AUTH_SECRET, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
node scripts/seed-admin.mjs
```
