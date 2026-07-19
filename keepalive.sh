#!/bin/bash
cd /home/z/my-project
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi
while true; do
  npx next dev -p 3000 2>&1
  sleep 1
done
