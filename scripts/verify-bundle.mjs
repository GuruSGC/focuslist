// The JavaScript bundle stays small: at most 120 KB gzipped.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { ensureBuild, root } from './lib/harness.mjs'

const BUDGET = 120 * 1024

await ensureBuild()
const dir = join(root, 'dist', 'assets')
const scripts = readdirSync(dir).filter((name) => name.endsWith('.js'))
if (scripts.length === 0) {
  console.error('No JavaScript found in dist/assets. Run npm run build first.')
  process.exit(1)
}
let total = 0
for (const name of scripts) {
  const size = gzipSync(readFileSync(join(dir, name))).length
  total += size
  console.log(`${name}: ${(size / 1024).toFixed(1)} KB gzip`)
}
if (total > BUDGET) {
  console.error(`JavaScript is ${(total / 1024).toFixed(1)} KB gzip, over the ${BUDGET / 1024} KB budget`)
  process.exit(1)
}
console.log(`BUNDLE-OK ${(total / 1024).toFixed(1)} KB gzip of ${BUDGET / 1024} KB`)
