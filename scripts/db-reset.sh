#!/usr/bin/env bash
# Drop database, recreate from zero, apply all migrations, then seed.
# ALL DATA WILL BE LOST. Run from project root: ./scripts/db-reset.sh

set -e

cd "$(dirname "$0")/.."

echo "⚠️  This will DROP the database and recreate it. All data will be lost."
echo "   Migrations will be applied from scratch. Seed will run after."
echo ""
read -p "Type 'yes' to continue: " confirm
if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

npx prisma migrate reset --force
echo "✅ Database reset complete. Migrations applied. Seed completed."
