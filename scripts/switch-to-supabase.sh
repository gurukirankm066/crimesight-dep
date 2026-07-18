#!/usr/bin/env bash
#
# CrimeSight AI — One-Click Supabase Migration
#
# Usage:
#   bun run scripts/switch-to-supabase.sh "YOUR_SUPABASE_DIRECT_URL"
#
# Get the URL from:
#   Supabase Dashboard → Settings → Database → Connection string → URI
#
# It looks like:
#   postgresql://postgres.abc123:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
#

set -e

SUPABASE_URL="$1"

if [ -z "$SUPABASE_URL" ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  CrimeSight AI — Switch to Supabase                         ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  echo "❌ Missing Supabase connection string!"
  echo ""
  echo "Usage:  bun run scripts/switch-to-supabase.sh \"YOUR_SUPABASE_URL\""
  echo ""
  echo "Get your connection string from:"
  echo "  Supabase Dashboard → Project → Settings → Database"
  echo "  → Connection string → URI (Transaction pooler mode)"
  echo ""
  echo "It looks like:"
  echo '  postgresql://postgres.abc123:password@aws-0-xx.pooler.supabase.com:6543/postgres'
  echo ""
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  CrimeSight AI — Switch to Supabase                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📦 Step 1/4: Switching Prisma schema to PostgreSQL..."
cp prisma/schema.postgres.prisma prisma/schema.prisma
echo "  ✅ Schema switched"
echo ""

echo "🏗️  Step 2/4: Pushing schema to Supabase..."
echo "  Writing Supabase URL to .env..."
cat > .env << ENVEOF
DATABASE_URL="${SUPABASE_URL}?pgbouncer=true"
DIRECT_DATABASE_URL="${SUPABASE_URL}"
NEXT_PRIVATE_DISABLE_DEVTOOLS=1
ENVEOF
echo "  ✅ .env updated"
echo ""

echo "🔄 Step 3/4: Generating Prisma client for PostgreSQL..."
npx prisma generate
echo "  ✅ Client generated"
echo ""

echo "🚀 Step 4/4: Running data migration..."
SUPABASE_DIRECT_URL="${SUPABASE_URL}" bun run scripts/migrate-to-supabase.ts
echo ""

echo "══════════════════════════════════════════════════════════════"
echo "  ✨ Migration complete!"
echo ""
echo "  Your .env now points to Supabase:"
echo "    DATABASE_URL=${SUPABASE_URL}?pgbouncer=true"
echo ""
echo "  Run: bun run dev"
echo "══════════════════════════════════════════════════════════════"
echo ""