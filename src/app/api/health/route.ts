import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    mode: 'synthetic-prototype',
    database: 'not-required-for-demo',
    nodeEnv: process.env.NODE_ENV,
  })
}
