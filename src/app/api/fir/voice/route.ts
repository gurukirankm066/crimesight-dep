export async function POST(request: Request) {
  try {
    const body = await request.json()
    const firNumber = `FIR/2026/KSP/VOICE-${String(Date.now()).slice(-5)}`
    return Response.json({
      success: true,
      fir: firNumber,
      message: 'Voice FIR registered successfully',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return Response.json(
      { success: false, message: 'Failed to register voice FIR' },
      { status: 500 }
    )
  }
}