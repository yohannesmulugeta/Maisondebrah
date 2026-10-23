import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', error => errors.push(error.message))
try {
  await page.goto('http://127.0.0.1:4174/Maisondebrah/', { waitUntil: 'networkidle' })
  console.log('Initial page errors:', errors, 'body:', (await page.locator('body').innerText()).slice(0, 150))
  const logoWidth = await page.locator('header img').evaluate(image => image.naturalWidth)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  console.log('Home:', await page.title(), 'logo width:', logoWidth, 'overflow:', overflow)
  await page.getByRole('link', { name: 'View all products' }).click()
  await page.waitForURL('**/#/shop/')
  console.log('Shop:', page.url(), 'visible products:', await page.locator('.product-card').count())
  await page.locator('.product-card').first().click()
  console.log('Product:', page.url(), await page.locator('.product-copy h1').innerText(), 'image width:', await page.locator('.large-img img').evaluate(image => image.naturalWidth))
  console.log('Page errors:', errors)
  if (!logoWidth || overflow || errors.length) process.exitCode = 1
} finally {
  await browser.close()
}
