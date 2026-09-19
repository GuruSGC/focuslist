// The brush stroke idea is fully removed from source, tests, scripts and the built page.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ensureBuild, root } from './lib/harness.mjs'

const PATTERN = /brush/i

/** Returns the matches in a piece of text. Exported shape kept simple so the control below can use it. */
const scan = (text) => (PATTERN.test(text) ? ['brush'] : [])

// Negative control: the scanner must catch each spelling we removed, or a clean result means nothing.
for (const sample of ['import { BrushJourney } from "./x"', 'data-testid="brush-stroke"', 'buildBristles(brush)']) {
  if (scan(sample).length === 0) {
    console.error(`Scanner failed its positive control for: ${sample}`)
    process.exit(1)
  }
}

const problems = []
for (const path of ['src/components/BrushJourney.tsx', 'src/components/Backdrop.tsx', 'src/lib/brush.ts', 'tests/brush.test.ts', 'scripts/verify-brush.mjs']) {
  if (existsSync(join(root, path))) problems.push(`${path} still exists`)
}

function* files(dir, extensions) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path, extensions)
    else if (extensions.test(name)) yield path
  }
}

await ensureBuild()
const targets = [
  ...files(join(root, 'src'), /\.(ts|tsx|css)$/),
  ...files(join(root, 'tests'), /\.ts$/),
  ...files(join(root, 'scripts'), /\.mjs$/),
  ...files(join(root, 'dist'), /\.(js|css|html)$/),
  join(root, 'index.html'),
]
for (const file of targets) {
  if (file.endsWith('verify-no-brush.mjs')) continue
  if (scan(readFileSync(file, 'utf8')).length) problems.push(`${file.replace(root, '')} mentions the brush stroke`)
}

if (problems.length) {
  console.error(`Brush stroke leftovers:\n${problems.join('\n')}`)
  process.exit(1)
}
console.log('NO-BRUSH-OK')
