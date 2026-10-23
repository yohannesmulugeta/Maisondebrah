import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []
const broken = []
const origin = 'http://127.0.0.1:5174'
await mkdir('reference/local', { recursive: true })
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`))
    await page.goto(origin, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 600) {
      await page.evaluate(position => window.scrollTo(0, position), y)
      await page.waitForTimeout(200)
    }
    await page.waitForTimeout(1500)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: `reference/local/home-${width}.png`, fullPage: true })
    const state = await page.evaluate(() => ({
      title: document.title,
      width: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      images: [...document.images].map(img => ({ src: img.src, ok: img.complete && img.naturalWidth > 0 })).filter(img => !img.ok),
    }))
    broken.push(...state.images)
    console.log('home', width, JSON.stringify(state))
    if (width === 390) {
      await page.getByRole('button', { name: 'Open menu' }).click()
      console.log('mobile menu visible', await page.locator('.menu').getByRole('link', { name: 'The Collection', exact: true }).isVisible())
    }
    await page.close()
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('pageerror', error => errors.push(`flow: ${error.message}`))
  await page.goto(`${origin}/shop/`, { waitUntil: 'networkidle' })
  console.log('shop cards', await page.locator('.product-card').count())
  await page.locator('.product-card').first().click()
  console.log('product title', await page.locator('.product-copy h1').innerText())
  await page.getByRole('button', { name: 'Add to quotation list' }).click()
  await page.getByRole('link', { name: 'View your quotation list' }).click()
  console.log('quote items', await page.locator('.quote-list>div').count())
  await page.close()
  console.log('page errors', errors.length, errors)
  console.log('broken images', broken.length, broken)
} finally { await browser.close() }
