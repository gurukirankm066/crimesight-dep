#!/bin/bash
export DATABASE_URL="postgresql://postgres.qfdiajswvoodbwpmjscu:Guru%40636070@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
export DIRECT_DATABASE_URL="postgresql://postgres.qfdiajswvoodbwpmjscu:Guru%40636070@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
export NEXT_PRIVATE_DISABLE_DEVTOOLS=1
cd /home/z/my-project
while true; do bun run dev > /home/z/my-project/dev.log 2>&1; sleep 2; done