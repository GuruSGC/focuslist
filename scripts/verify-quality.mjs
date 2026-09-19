// Type-check, lint, and scan source for banned patterns.
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { root } from './lib/harness.mjs'

const RULES = [
  [/:\s*any\b|\bas\s+any\b|<any>/, 'an "any" type'],
  [/\bconsole\.\w+/, 'a console call'],
  [/\b(TODO|FIXME|XXX)\b/, 'a TODO or FIXME'],
  [/[–—]/, 'an em or en dash'],
  [/\p{Extended_Pictographic}/u, 'an emoji'],
]

export function scan(text) {
  return RULES.filter(([pattern]) => pattern.test(text)).map(([, name]) => name)
}

function* files(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'fonts') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.(ts|tsx|css|html)$/.test(name)) yield path
  }
}

// Negative control: every rule must fire on a known-bad sample.
for (const sample of ['const a: any = 1', "console.log('x')", '// TODO fix', 'Task — done', 'Done ✅']) {
  if (scan(sample).length === 0) {
    console.error(`Scanner failed its positive control for: ${sample}`)
    process.exit(1)
  }
}

const run = (command) => execSync(command, { cwd: root, stdio: 'pipe', encoding: 'utf8' })
try {
  run('npx tsc --noEmit')
  run('npx eslint .')
} catch (error) {
  console.error(`${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n').slice(0, 25).join('\n'))
  process.exit(1)
}

const problems = []
for (const target of [join(root, 'src'), join(root, 'tests'), join(root, 'index.html')]) {
  const list = statSync(target).isDirectory() ? [...files(target)] : [target]
  for (const file of list) {
    const text = readFileSync(file, 'utf8')
    // The design contract comment in index.html and the kanji themselves are allowed; skip nothing else.
    const hits = scan(text)
    if (hits.length) problems.push(`${file.replace(root, '')}: ${hits.join(', ')}`)
  }
}
if (problems.length) {
  console.error(`Banned patterns found:\n${problems.join('\n')}`)
  process.exit(1)
}
console.log('QUALITY-OK')
