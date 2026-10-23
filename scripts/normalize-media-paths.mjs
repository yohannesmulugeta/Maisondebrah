import { readdir, rename, stat } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'

const root = resolve('public/media')
let fixed = 0
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = resolve(join(directory, entry.name))
    if (!source.startsWith(root + sep)) throw new Error(`Outside media directory: ${source}`)
    if (entry.isDirectory()) { await visit(source); continue }
    if (!entry.name.includes('%')) continue
    const target = resolve(join(directory, decodeURIComponent(entry.name)))
    if (!target.startsWith(root + sep)) throw new Error(`Outside media directory: ${target}`)
    try { await stat(target); throw new Error(`Target already exists: ${target}`) } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    await rename(source, target)
    fixed++
  }
}
await visit(root)
console.log(`Normalized ${fixed} media filenames`)
