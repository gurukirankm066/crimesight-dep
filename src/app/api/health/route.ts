import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const url = process.env.DATABASE_URL || 'NOT SET'
    const maskedUrl = url
      .replace(/\/\/[^:]+:/, '//***:')
      .replace(/@[^/]+/, '@***')

    const cases = await db.caseMaster.count()
    const districts = await db.district.count()

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      dbUrl: maskedUrl,
      cases,
      districts,
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      dbUrl: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      nodeEnv: process.env.NODE_ENV,
    }, { status: 500 })
  }
}