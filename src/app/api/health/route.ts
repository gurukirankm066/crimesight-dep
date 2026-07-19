import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cases = await db.caseMaster.count()
    const districts = await db.district.count()

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      cases,
      districts,
      nodeEnv: process.env.NODE_ENV,
    })
  } catch {
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: 'Database health check failed',
      nodeEnv: process.env.NODE_ENV,
    }, { status: 500 })
  }
}
