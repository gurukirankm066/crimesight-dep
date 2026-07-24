const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

async function recordDemo() {
  console.log('🎥 Launching Playwright browser to record demo video...')
  const videosDir = path.join(__dirname, '..', 'videos')
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true })

  const browser = await chromium.launch({
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videosDir,
      size: { width: 1440, height: 900 },
    },
  })

  const page = await context.newPage()

  try {
    console.log('🌐 Navigating to CrimeSight AI application...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Login page step
    console.log('🔑 Performing demo login...')
    const loginButton = page.locator('button:has-text("Enter Prototype Workspace"), button:has-text("Sign in")')
    if (await loginButton.count() > 0) {
      await loginButton.first().click()
      await page.waitForTimeout(2000)
    }

    // Step 1: Command Center & Geo Map
    console.log('🗺️ Step 1: Geo Intelligence Map & Workspace...')
    await page.waitForTimeout(3000)

    // Trigger Simulate Alert
    console.log('⚡ Step 2: Triggering Live Alert Simulation...')
    const simulateBtn = page.locator('button:has-text("Simulate Alert")')
    if (await simulateBtn.count() > 0) {
      await simulateBtn.first().click()
      await page.waitForTimeout(4000)
      await simulateBtn.first().click()
      await page.waitForTimeout(3000)
    }

    // Step 3: Network Tab
    console.log('🕸️ Step 3: Navigating to Network Link Analysis...')
    const networkTab = page.locator('button[role="tab"]:has-text("Network"), button[role="tab"]:has-text("LNK")')
    if (await networkTab.count() > 0) {
      await networkTab.first().click()
      await page.waitForTimeout(5000)
    }

    // Step 4: Judge Story Mode
    console.log('⚖️ Step 4: Launching Judge Story Mode...')
    const judgeBtn = page.locator('button:has-text("Judge Story"), button:has-text("Judge")')
    if (await judgeBtn.count() > 0) {
      await judgeBtn.first().click()
      await page.waitForTimeout(4000)

      // Step through Judge Story steps
      const nextBtn = page.locator('button:has-text("Next")')
      for (let i = 0; i < 4; i++) {
        if (await nextBtn.count() > 0) {
          const approveBtn = page.locator('button:has-text("Approve review")')
          if (await approveBtn.count() > 0 && await approveBtn.first().isVisible()) {
            console.log('  -> Approving governed review action...')
            await approveBtn.first().click()
            await page.waitForTimeout(2000)
          }
          await nextBtn.first().click()
          await page.waitForTimeout(4000)
        }
      }

      // Exit Judge Demo
      const closeBtn = page.locator('button[aria-label="Close demo mode"], button:has-text("Exit")')
      if (await closeBtn.count() > 0) {
        await closeBtn.first().click()
        await page.waitForTimeout(2000)
      }
    }

    // Step 5: Voice FIR Intake
    console.log('🎙️ Step 5: Opening Voice FIR Modal...')
    const voiceBtn = page.locator('button[aria-label="Voice FIR"]')
    if (await voiceBtn.count() > 0) {
      await voiceBtn.first().click()
      await page.waitForTimeout(4000)
    }

    console.log('✅ Video recording completed successfully!')
  } catch (err) {
    console.error('⚠️ Recording error:', err.message)
  } finally {
    await context.close()
    await browser.close()
  }
}

recordDemo()
