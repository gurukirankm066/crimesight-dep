#!/bin/bash
# CrimeSight AI - One-click setup script
# Run this after extracting the zip on your laptop

echo "🔧 CrimeSight AI Setup"
echo "======================"

# Step 1: Install dependencies
echo ""
echo "📦 Step 1: Installing dependencies..."
bun install

# Step 2: Generate Prisma client
echo ""
echo "🗃️  Step 2: Generating database client..."
npx prisma generate

# Step 3: Verify database
echo ""
echo "🔍 Step 3: Verifying database..."
if [ -f "db/custom.db" ]; then
  CASES=$(sqlite3 db/custom.db "SELECT COUNT(*) FROM CaseMaster;" 2>/dev/null || echo "unknown")
  echo "✅ Database found with $CASES cases"
else
  echo "❌ Database not found at db/custom.db"
  exit 1
fi

echo ""
echo "✅ Setup complete! Run the app with:"
echo "   bun run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"