#!/usr/bin/env bash
#
# CrimeSight AI — Rollback to SQLite (if Supabase migration fails)
#
set -e

echo ""
echo "🔄 Rolling back to SQLite..."

cp prisma/schema.sqlite.prisma prisma/schema.prisma
cat > .env << 'ENVEOF'
DATABASE_URL=file:./db/custom.db
NEXT_PRIVATE_DISABLE_DEVTOOLS=1
ENVEOF

npx prisma generate

echo "✅ Rolled back to SQLite successfully!"
echo "   Run: bun run dev"
echo ""