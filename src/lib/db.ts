import { PrismaClient } from '@prisma/client'

// Database credentials are supplied only through deployment environment variables.
// Never hard-code operational connection strings in source control.

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
