#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="postgresql://postgres.qfdiajswvoodbwpmjscu:Guru%40636070@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
while true; do
  npx next dev -p 3000 2>&1
  sleep 1
done
