const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

async function recordLiveDemo() {
  const liveUrl = 'https://crimesight-dep-onmoxbpk.onslate.in/'
  console.log(`🌐 Connecting to live deployment: ${liveUrl}`)

  const videosDir = path.join(__dirname, '..', 'videos')
  const screenshotsDir = path.join(__dirname, '..', 'screenshots')
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true })
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true })

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--enable-features=Vulkan',
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
    console.log('🚀 Loading live website...')
    await page.goto(liveUrl, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(3000)
    await page.screenshot({ path: path.join(screenshotsDir, '01_login_screen.png') })

    // Step 1: Login
    console.log('🔑 Clicking Enter Prototype Workspace...')
    const loginButton = page.locator('button:has-text("Enter Prototype Workspace"), button:has-text("Sign in")')
    if (await loginButton.count() > 0) {
      await loginButton.first().click()
      await page.waitForTimeout(3000)
    }
    await page.screenshot({ path: path.join(screenshotsDir, '02_command_center.png') })

    // Step 2: Simulate Live Alert
    console.log('⚡ Triggering Simulate Alert...')
    const simulateBtn = page.locator('button:has-text("Simulate Alert")')
    if (await simulateBtn.count() > 0) {
      await simulateBtn.first().click()
      await page.waitForTimeout(3000)
      await page.screenshot({ path: path.join(screenshotsDir, '03_simulated_alert.png') })
      await simulateBtn.first().click()
      await page.waitForTimeout(3000)
    }

    // Step 3: Network Link Analysis
    console.log('🕸️ Navigating to Network tab...')
    const networkTab = page.locator('button[role="tab"]:has-text("Network"), button[role="tab"]:has-text("LNK")')
    if (await networkTab.count() > 0) {
      await networkTab.first().click()
      await page.waitForTimeout(4000)
      await page.screenshot({ path: path.join(screenshotsDir, '04_network_tab.png') })
    }

    // Step 4: Judge Story Mode
    console.log('⚖️ Launching Judge Story Mode...')
    const judgeBtn = page.locator('button:has-text("Judge Story"), button:has-text("Judge")')
    if (await judgeBtn.count() > 0) {
      await judgeBtn.first().click()
      await page.waitForTimeout(3000)
      await page.screenshot({ path: path.join(screenshotsDir, '05_judge_story_step1.png') })

      // Step through Judge Story steps
      const nextBtn = page.locator('button:has-text("Next")')
      for (let i = 1; i <= 4; i++) {
        if (await nextBtn.count() > 0) {
          const approveBtn = page.locator('button:has-text("Approve review")')
          if (await approveBtn.count() > 0 && await approveBtn.first().isVisible()) {
            console.log('  -> Approving governed review action...')
            await approveBtn.first().click()
            await page.waitForTimeout(2000)
          }
          await nextBtn.first().click()
          await page.waitForTimeout(3000)
          await page.screenshot({ path: path.join(screenshotsDir, `05_judge_story_step${i+1}.png`) })
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
    console.log('🎙️ Opening Voice FIR Modal...')
    const voiceBtn = page.locator('button[aria-label="Voice FIR"]')
    if (await voiceBtn.count() > 0) {
      await voiceBtn.first().click()
      await page.waitForTimeout(3000)
      await page.screenshot({ path: path.join(screenshotsDir, '06_voice_fir_modal.png') })
    }

    console.log('✅ Live deployment video walkthrough recorded successfully!')
  } catch (err) {
    console.error('⚠️ Recording error:', err)
  } finally {
    await context.close()
    await browser.close()
  }
}

recordLiveDemo()
