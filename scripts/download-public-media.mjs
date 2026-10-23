import { chromium } from 'playwright'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'

const catalog = JSON.parse(await readFile('src/data/catalog.json', 'utf8'))
const pages = JSON.parse(await readFile('src/data/pages.json', 'utf8'))
const posts = JSON.parse(await readFile('src/data/posts.json', 'utf8'))
const inspection = JSON.parse(await readFile('reference/public-inspection.json', 'utf8'))
const urls = new Set()
const add = (url) => {
  if (typeof url === 'string' && /^https:\/\/maisondebrah\.com\/wp-content\/uploads\/.*\.(jpe?g|png|webp|svg|gif)(\?.*)?$/i.test(url)) urls.add(url.split('?')[0])
}

for (const product of catalog.products) for (const image of product.images) add(image.src)
for (const page of [...pages, ...posts]) {
  for (const match of page.content.matchAll(/https:\/\/maisondebrah\.com\/wp-content\/uploads\/[^"'\s<>),]+\.(?:jpe?g|png|webp|svg|gif)/gi)) add(match[0])
}
for (const data of Object.values(inspection)) {
  for (const image of data.images) add(image.src)
  for (const background of data.backgrounds) for (const match of background.background.matchAll(/https:\/\/maisondebrah\.com\/wp-content\/uploads\/[^"'\s<>),]+\.(?:jpe?g|png|webp|svg|gif)/gi)) add(match[0])
}

const list = [...urls]
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext()
const successes = new Set()
const failures = []
let next = 0
let finished = 0

async function worker() {
  const page = await context.newPage()
  while (next < list.length) {
    const url = list[next++]
    const relative = decodeURIComponent(new URL(url).pathname.replace('/wp-content/uploads/', ''))
    const target = join('public', 'media', relative)
    await mkdir(dirname(target), { recursive: true })
    let success = false
    for (let attempt = 1; attempt <= 3 && !success; attempt++) {
      try {
        const response = await page.goto(url, { waitUntil: 'commit', timeout: 40000 })
        if (!response?.ok()) throw new Error(`HTTP ${response?.status()}`)
        const body = await response.body()
        if (!body.length) throw new Error('empty response')
        await writeFile(target, body)
        successes.add(url)
        success = true
      } catch (error) {
        if (attempt === 3) failures.push({ url, error: String(error) })
        else await page.waitForTimeout(attempt * 1500)
      }
    }
    finished++
    if (finished % 50 === 0) console.log(`${finished}/${list.length} media checked; ${successes.size} saved; ${failures.length} failed`)
  }
  await page.close()
}

try {
  await Promise.all(Array.from({ length: 6 }, worker))
  await mkdir('src/data', { recursive: true })
  await writeFile('src/data/media-manifest.json', JSON.stringify({ saved: [...successes], failures }, null, 2))
  console.log(`Done: ${successes.size}/${list.length} assets saved; ${failures.length} failed`)
} finally {
  await browser.close()
}
