const { chromium } = require('playwright')
const { spawn } = require('child_process')
const path = require('path')

async function record3MinDemo() {
  const liveUrl = 'https://crimesight-dep-onmoxbpk.onslate.in/'
  const audioFile = path.join(__dirname, '..', 'crimesight_demo_voiceover.m4a')
  const videoFile = path.join(__dirname, '..', 'crimesight_3min_live_demo.mov')

  console.log('🎙️ Starting 3-minute audio narration...')
  const audioProc = spawn('afplay', [audioFile])

  console.log('🎥 Starting screen recording...')
  const captureProc = spawn('screencapture', ['-v', '-V', '160', '-D', '1', '-g', videoFile])

  console.log('🌐 Opening Chromium browser on live deployment...')
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })

  const page = await context.newPage()

  try {
    console.log('🚀 Loading live website...')
    await page.goto(liveUrl, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(5000)

    // Step 1: Login
    console.log('🔑 0:00 - 0:45: Problem Statement Overview & Login...')
    const loginButton = page.locator('button:has-text("Enter Prototype Workspace"), button:has-text("Sign in")')
    if (await loginButton.count() > 0) {
      await loginButton.first().click()
      await page.waitForTimeout(6000)
    }

    // Step 2: Command Center & Geo Map
    console.log('🗺️ 0:45 - 1:15: Command Center & Spatial Geo Intel Map...')
    await page.waitForTimeout(10000)

    // Step 3: Trigger Live Alert Simulation
    console.log('⚡ 1:15 - 1:45: Live Incident Ingestion & Alerting...')
    const simulateBtn = page.locator('button:has-text("Simulate Alert")')
    if (await simulateBtn.count() > 0) {
      await simulateBtn.first().click()
      await page.waitForTimeout(5000)
      await simulateBtn.first().click()
      await page.waitForTimeout(5000)
    }

    // Step 4: Network Link Analysis
    console.log('🕸️ 1:45 - 2:15: Network Entity Graph & Suspect Linkages...')
    const networkTab = page.locator('button[role="tab"]:has-text("Network"), button[role="tab"]:has-text("LNK")')
    if (await networkTab.count() > 0) {
      await networkTab.first().click()
      await page.waitForTimeout(12000)
    }

    // Step 5: Judge Story Mode
    console.log('⚖️ 2:15 - 2:45: Judge Story Mode & Governed Audit Approval...')
    const judgeBtn = page.locator('button:has-text("Judge Story"), button:has-text("Judge")')
    if (await judgeBtn.count() > 0) {
      await judgeBtn.first().click()
      await page.waitForTimeout(5000)

      const nextBtn = page.locator('button:has-text("Next")')
      for (let i = 1; i <= 4; i++) {
        if (await nextBtn.count() > 0) {
          const approveBtn = page.locator('button:has-text("Approve review")')
          if (await approveBtn.count() > 0 && await approveBtn.first().isVisible()) {
            console.log('  -> Approving governed review action...')
            await approveBtn.first().click()
            await page.waitForTimeout(3000)
          }
          await nextBtn.first().click()
          await page.waitForTimeout(5000)
        }
      }

      const closeBtn = page.locator('button[aria-label="Close demo mode"], button:has-text("Exit")')
      if (await closeBtn.count() > 0) {
        await closeBtn.first().click()
        await page.waitForTimeout(2000)
      }
    }

    // Step 6: Voice FIR Intake
    console.log('🎙️ 2:45 - 3:00: Voice FIR Intake Modal & Summary...')
    const voiceBtn = page.locator('button[aria-label="Voice FIR"]')
    if (await voiceBtn.count() > 0) {
      await voiceBtn.first().click()
      await page.waitForTimeout(10000)
    }

    console.log('🎉 3-Minute Demo Video Recording Finished!')
  } catch (err) {
    console.error('⚠️ Recording error:', err)
  } finally {
    await page.waitForTimeout(3000)
    await browser.close()
  }
}

record3MinDemo()
