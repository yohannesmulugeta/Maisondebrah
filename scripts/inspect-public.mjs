import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const paths = ['/', '/the-collection/', '/about-maison-debrah/', '/hospitality/', '/franchise-shops/', '/shop/']
const result = {}

try {
  await mkdir('reference', { recursive: true })
  for (const path of paths) {
    await page.goto(`https://maisondebrah.com${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(3500)
    for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 650) {
      await page.evaluate((position) => window.scrollTo(0, position), y)
      await page.waitForTimeout(130)
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(1200)
    const data = await page.evaluate(() => ({
      title: document.title,
      headings: [...document.querySelectorAll('h1,h2,h3')].map((e) => ({ tag: e.tagName, text: e.textContent?.trim() })).filter((e) => e.text),
      images: [...document.images].map((e) => ({ src: e.currentSrc || e.src, alt: e.alt, width: e.naturalWidth, height: e.naturalHeight })).filter((e) => e.src),
      backgrounds: [...document.querySelectorAll('*')].map((e) => ({
        tag: e.tagName, className: typeof e.className === 'string' ? e.className.slice(0, 120) : '',
        background: getComputedStyle(e).backgroundImage,
      })).filter((e) => e.background && e.background !== 'none'),
    }))
    result[path] = data
    if (path === '/') await page.screenshot({ path: 'reference/home-desktop.png', fullPage: true })
    console.log(path, data.images.length, data.backgrounds.length)
  }
  await writeFile('reference/public-inspection.json', JSON.stringify(result, null, 2))
} finally {
  await browser.close()
}
