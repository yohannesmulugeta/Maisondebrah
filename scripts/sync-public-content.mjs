import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const origin = 'https://maisondebrah.com'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()

async function get(path) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await page.evaluate(async (url) => {
        const response = await fetch(url, { signal: AbortSignal.timeout(25000) })
        if (!response.ok) throw new Error(`${url}: ${response.status}`)
        return { total: Number(response.headers.get('x-wp-total') || 0), data: await response.json() }
      }, path)
    } catch (error) {
      if (attempt === 3) throw error
      await page.waitForTimeout(attempt * 5000)
    }
  }
}

async function getAll(path, perPage = 100) {
  const first = await get(`${path}${path.includes('?') ? '&' : '?'}per_page=${perPage}&page=1`)
  const items = [...first.data]
  for (let number = 2; number <= Math.ceil(first.total / perPage); number++) {
    const next = await get(`${path}${path.includes('?') ? '&' : '?'}per_page=${perPage}&page=${number}`)
    items.push(...next.data)
  }
  if (first.total && items.length !== first.total) throw new Error(`${path}: expected ${first.total}, got ${items.length}`)
  return items
}

try {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 30000 })
      break
    } catch (error) {
      if (attempt === 3) throw error
      await page.waitForTimeout(attempt * 5000)
    }
  }
  const products = (await getAll('/wp-json/wc/store/v1/products')).map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    path: new URL(item.permalink).pathname,
    type: item.type,
    sku: item.sku,
    description: item.description,
    shortDescription: item.short_description,
    images: item.images.map(({ src, thumbnail, alt }) => ({ src, thumbnail, alt })),
    categories: item.categories.map(({ id, name, slug, link }) => ({ id, name, slug, path: new URL(link).pathname })),
    attributes: item.attributes,
    variations: item.variations,
    dimensions: item.dimensions,
    formattedDimensions: item.formatted_dimensions,
    tags: item.tags,
  }))
  const categories = (await getAll('/wp-json/wc/store/v1/products/categories')).map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    parent: item.parent,
    count: item.count,
    path: item.permalink ? new URL(item.permalink).pathname : `/product-category/${item.slug}/`,
    image: item.image?.src || null,
  }))
  const pages = (await getAll('/wp-json/wp/v2/pages')).map((item) => ({
    id: item.id,
    title: item.title.rendered,
    path: new URL(item.link).pathname,
    content: item.content.rendered,
    seo: item.yoast_head_json || null,
  }))
  const posts = (await getAll('/wp-json/wp/v2/posts')).map((item) => ({
    id: item.id,
    title: item.title.rendered,
    path: new URL(item.link).pathname,
    content: item.content.rendered,
    date: item.date,
    seo: item.yoast_head_json || null,
  }))

  await mkdir('src/data', { recursive: true })
  await writeFile('src/data/catalog.json', JSON.stringify({ products, categories }, null, 2))
  await writeFile('src/data/pages.json', JSON.stringify(pages, null, 2))
  await writeFile('src/data/posts.json', JSON.stringify(posts, null, 2))
  console.log(`Saved ${products.length} products, ${categories.length} categories, ${pages.length} pages, ${posts.length} posts`)
} finally {
  await browser.close()
}
