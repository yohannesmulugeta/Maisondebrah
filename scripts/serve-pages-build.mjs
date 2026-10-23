import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

const root = resolve('dist')
const prefix = '/Maisondebrah/'
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  if (!pathname.startsWith(prefix)) { response.writeHead(404); response.end(); return }
  const relative = pathname.slice(prefix.length) || 'index.html'
  const path = resolve(root, relative)
  if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403); response.end(); return }
  try {
    const data = await readFile(path)
    response.writeHead(200, { 'content-type': types[extname(path).toLowerCase()] || 'application/octet-stream' })
    response.end(data)
  } catch {
    response.writeHead(404)
    response.end()
  }
}).listen(4174, '127.0.0.1', () => console.log('Pages build preview: http://127.0.0.1:4174/Maisondebrah/'))
