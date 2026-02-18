#!/usr/bin/env bash
# Resolve failed Prisma migrations so deploy can run.
# Run from project root: ./scripts/resolve-failed-migrations.sh
# If deploy still reports a failed migration, add its name below and run again.

set -e

cd "$(dirname "$0")/.."

# Known failed migrations (mark as applied so deploy can proceed)
FAILED_MIGRATIONS=(
  "20260213000000_add_search_keyword"
  "20260216200000_skill_approval_workflow"
  "20260216300000_keyword_approval_workflow"
)

for name in "${FAILED_MIGRATIONS[@]}"; do
  echo "Resolving migration: $name"
  npx prisma migrate resolve --applied "$name" 2>/dev/null || true
done

echo "Running migrate deploy..."
npx prisma migrate deploy
