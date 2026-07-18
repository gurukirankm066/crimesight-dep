import { PrismaClient } from '@prisma/client'

// Always use Supabase PostgreSQL — override any stale env var
process.env.DATABASE_URL = 'postgresql://postgres.qfdiajswvoodbwpmjscu:Guru%40636070@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ log: [] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/** Serialize raw DB results — converts BigInt values to Number for JSON safety */
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? Number(v) : v))
}