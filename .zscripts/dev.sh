#!/bin/bash
# CrimeSight AI - Custom dev script
# This replaces the default bun flow in start.sh
# Key: skip db:push (Supabase unreachable) and add respawn loop for dev server

set -a
source /home/z/.bash_profile 2>/dev/null || true
set +a

cd /home/z/my-project

# Install dependencies (non-blocking)
echo "[DEV] Installing dependencies..."
bun install --no-save 2>/dev/null || true
echo "[DEV] Dependencies installed (or already present)"

# Skip db:push - Supabase PostgreSQL is unreachable from sandbox
# Demo data fallback handles all API routes
echo "[DEV] Skipping db:push (using demo data fallback)"

# Start dev server with respawn loop
echo "[DEV] Starting Next.js dev server with respawn..."
while true; do
  echo "[DEV] $(date) - Starting bun run dev..."
  bun run dev
  EXIT_CODE=$?
  echo "[DEV] $(date) - Dev server exited with code $EXIT_CODE, restarting in 3s..."
  sleep 3
done