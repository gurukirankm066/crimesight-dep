const { chromium } = require('playwright')
const { spawn } = require('child_process')
const path = require('path')

async function recordFlawlessDemo() {
  const liveUrl = 'https://crimesight-dep-onmoxbpk.onslate.in/'
  const outputFile = path.join(__dirname, '..', 'crimesight_perfect_demo.mov')
  const audioFile = path.join(__dirname, '..', 'crimesight_demo_voiceover.m4a')

  console.log('🎙️ Starting audio voiceover playback via afplay...')
  const audioProc = spawn('afplay', [audioFile])

  console.log('📹 Starting native macOS screen video recording...')
  const captureProc = spawn('screencapture', ['-v', '-V', '55', '-D', '1', '-g', outputFile])

  console.log('🌐 Launching Chrome browser window...')
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized', '--window-size=1440,900'],
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })

  const page = await context.newPage()

  try {
    console.log('🚀 Loading live website...')
    await page.goto(liveUrl, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(4000)

    // Step 1: Login
    console.log('🔑 Step 1: Login...')
    const loginButton = page.locator('button:has-text("Enter Prototype Workspace"), button:has-text("Sign in")')
    if (await loginButton.count() > 0) {
      await loginButton.first().click()
      await page.waitForTimeout(4000)
    }

    // Step 2: Command Center & Geo Map
    console.log('🗺️ Step 2: Command Center & Geo Map...')
    await page.waitForTimeout(5000)

    // Step 3: Trigger Alert Simulation
    console.log('⚡ Step 3: Triggering Live Alert...')
    const simulateBtn = page.locator('button:has-text("Simulate Alert")')
    if (await simulateBtn.count() > 0) {
      await simulateBtn.first().click()
      await page.waitForTimeout(4000)
      await simulateBtn.first().click()
      await page.waitForTimeout(4000)
    }

    // Step 4: Network Link Analysis
    console.log('🕸️ Step 4: Network Tab Link Graph...')
    const networkTab = page.locator('button[role="tab"]:has-text("Network"), button[role="tab"]:has-text("LNK")')
    if (await networkTab.count() > 0) {
      await networkTab.first().click()
      await page.waitForTimeout(6000)
    }

    // Step 5: Judge Story Mode
    console.log('⚖️ Step 5: Judge Story Mode...')
    const judgeBtn = page.locator('button:has-text("Judge Story"), button:has-text("Judge")')
    if (await judgeBtn.count() > 0) {
      await judgeBtn.first().click()
      await page.waitForTimeout(4000)

      const nextBtn = page.locator('button:has-text("Next")')
      for (let i = 1; i <= 4; i++) {
        if (await nextBtn.count() > 0) {
          const approveBtn = page.locator('button:has-text("Approve review")')
          if (await approveBtn.count() > 0 && await approveBtn.first().isVisible()) {
            console.log('  -> Approving governed review action...')
            await approveBtn.first().click()
            await page.waitForTimeout(2500)
          }
          await nextBtn.first().click()
          await page.waitForTimeout(4000)
        }
      }

      const closeBtn = page.locator('button[aria-label="Close demo mode"], button:has-text("Exit")')
      if (await closeBtn.count() > 0) {
        await closeBtn.first().click()
        await page.waitForTimeout(2000)
      }
    }

    // Step 6: Voice FIR
    console.log('🎙️ Step 6: Voice FIR Intake...')
    const voiceBtn = page.locator('button[aria-label="Voice FIR"]')
    if (await voiceBtn.count() > 0) {
      await voiceBtn.first().click()
      await page.waitForTimeout(5000)
    }

    console.log('🎉 Flawless screen recording finished!')
  } catch (err) {
    console.error('⚠️ Error during recording:', err)
  } finally {
    await page.waitForTimeout(3000)
    await browser.close()
  }
}

recordFlawlessDemo()
