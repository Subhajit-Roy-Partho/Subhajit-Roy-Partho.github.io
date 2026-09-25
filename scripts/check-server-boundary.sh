#!/usr/bin/env bash
# L5: server-module boundary check.
#
# lib/auth.ts, lib/server/*, and @/db/* must only be imported from
# server-side code (API routes, server libs, drizzle-owned files, and
# server-run scripts). Client components, the PC CLI, and static pages
# must never pull them in — doing so would bundle secrets-adjacent code
# (or break the GitHub Pages static export, which deletes those dirs).
#
# Fails with the offending lines. Allowed importers:
#   app/api/**  lib/server/**  lib/auth.ts  db/**  scripts/**  drizzle.config.ts
set -euo pipefail

cd "$(dirname "$0")/.."

pattern='(@/lib/auth|@/lib/server|@/db|lib/server/)'
allowed='^(app/api/|lib/server/|lib/auth\.ts|db/|scripts/|drizzle\.config\.ts)'

offenders=""
while IFS= read -r line; do
  file="${line%%:*}"
  case "$file" in
    node_modules/*|.next/*|out/*) continue ;;
  esac
  if printf '%s' "$file" | grep -Eq "$allowed"; then
    continue
  fi
  offenders+="${line}"$'\n'
done < <(grep -rnE "(from|import\(|require\()[\"'][^\"']*${pattern}" \
  --include='*.ts' --include='*.tsx' --include='*.mjs' --include='*.mts' \
  app cli components lib db scripts drizzle.config.ts 2>/dev/null || true)

if [ -n "$offenders" ]; then
  printf 'server-boundary: forbidden server-module imports found:\n%s' "$offenders" >&2
  printf 'Only app/api/**, lib/server/**, lib/auth.ts, db/**, and scripts/** may import lib/auth, lib/server, or @/db.\n' >&2
  exit 1
fi
printf 'server-boundary: ok\n'
