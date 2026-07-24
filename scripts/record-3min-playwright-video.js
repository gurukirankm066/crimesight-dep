const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

async function record3MinPlaywrightVideo() {
  const liveUrl = 'https://crimesight-dep-onmoxbpk.onslate.in/'
  console.log(`🌐 Connecting to live deployment: ${liveUrl}`)

  const videosDir = path.join(__dirname, '..', 'videos')
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true })

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--use-gl=swiftshader',
    ],
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: videosDir,
      size: { width: 1440, height: 900 },
    },
  })

  const page = await context.newPage()

  try {
    console.log('🚀 [0:00 - 0:25] Loading live website & showing Login Screen...')
    await page.goto(liveUrl, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(10000)

    // Step 1: Login
    console.log('🔑 [0:25 - 0:45] Clicking Enter Prototype Workspace...')
    const loginButton = page.locator('button:has-text("Enter Prototype Workspace"), button:has-text("Sign in")')
    if (await loginButton.count() > 0) {
      await loginButton.first().click()
      await page.waitForTimeout(15000)
    }

    // Step 2: Geo Intelligence Map & Live Alert
    console.log('🗺️ [0:45 - 1:25] Command Center & Spatial Geo Intel Map...')
    await page.waitForTimeout(15000)

    console.log('⚡ Triggering Live Alert Simulation...')
    const simulateBtn = page.locator('button:has-text("Simulate Alert")')
    if (await simulateBtn.count() > 0) {
      await simulateBtn.first().click()
      await page.waitForTimeout(10000)
      await simulateBtn.first().click()
      await page.waitForTimeout(10000)
    }

    // Step 3: Network Link Analysis
    console.log('🕸️ [1:25 - 2:05] Navigating to Network Link Analysis...')
    const networkTab = page.locator('button[role="tab"]:has-text("Network"), button[role="tab"]:has-text("LNK")')
    if (await networkTab.count() > 0) {
      await networkTab.first().click()
      await page.waitForTimeout(25000)
    }

    // Step 4: Judge Story Mode
    console.log('⚖️ [2:05 - 2:40] Launching Judge Story Mode...')
    const judgeBtn = page.locator('button:has-text("Judge Story"), button:has-text("Judge")')
    if (await judgeBtn.count() > 0) {
      await judgeBtn.first().click()
      await page.waitForTimeout(8000)

      const nextBtn = page.locator('button:has-text("Next")')
      for (let i = 1; i <= 4; i++) {
        if (await nextBtn.count() > 0) {
          const approveBtn = page.locator('button:has-text("Approve review")')
          if (await approveBtn.count() > 0 && await approveBtn.first().isVisible()) {
            console.log('  -> Approving governed review action...')
            await approveBtn.first().click()
            await page.waitForTimeout(5000)
          }
          await nextBtn.first().click()
          await page.waitForTimeout(6000)
        }
      }

      const closeBtn = page.locator('button[aria-label="Close demo mode"], button:has-text("Exit")')
      if (await closeBtn.count() > 0) {
        await closeBtn.first().click()
        await page.waitForTimeout(3000)
      }
    }

    // Step 5: Voice FIR Intake & Conclusion
    console.log('🎙️ [2:40 - 3:00] Opening Voice FIR Intake Modal...')
    const voiceBtn = page.locator('button[aria-label="Voice FIR"]')
    if (await voiceBtn.count() > 0) {
      await voiceBtn.first().click()
      await page.waitForTimeout(15000)
    }

    console.log('✅ Full 3-Minute Video Recording Finished!')
  } catch (err) {
    console.error('⚠️ Recording error:', err)
  } finally {
    await context.close()
    await browser.close()
  }
}

record3MinPlaywrightVideo()
