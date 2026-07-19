#!/bin/bash
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

export DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}"
export NEXT_PRIVATE_DISABLE_DEVTOOLS=1
cd /home/z/my-project
while true; do bun run dev > /home/z/my-project/dev.log 2>&1; sleep 2; done
