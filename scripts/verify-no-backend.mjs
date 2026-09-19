// FocusList is frontend-only: no network calls in source and no backend dependencies.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { root } from './lib/harness.mjs'

const BANNED_SOURCE = [
  [/\bfetch\s*\(/, 'fetch()'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bnew\s+WebSocket\b/, 'WebSocket'],
  [/\bEventSource\b/, 'EventSource'],
  [/\bsendBeacon\b/, 'sendBeacon'],
  [/from\s+['"](axios|firebase|@supabase|socket\.io-client|graphql-request|apollo)/, 'a network or backend client import'],
]
const BANNED_DEPENDENCIES = /^(axios|express|koa|fastify|firebase|@supabase\/.*|mongoose|prisma|socket\.io.*|apollo.*|graphql.*)$/

export function scan(text) {
  return BANNED_SOURCE.filter(([pattern]) => pattern.test(text)).map(([, name]) => name)
}

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) yield path
  }
}

// Negative control: the scanner must catch each kind of violation, or a clean result means nothing.
for (const sample of ["fetch('/api/tasks')", 'new XMLHttpRequest()', "new WebSocket('wss://x')", "import axios from 'axios'"]) {
  if (scan(sample).length === 0) {
    console.error(`Scanner failed its positive control for: ${sample}`)
    process.exit(1)
  }
}

const problems = []
for (const file of files(join(root, 'src'))) {
  const hits = scan(readFileSync(file, 'utf8'))
  if (hits.length) problems.push(`${file.replace(root, '')}: ${hits.join(', ')}`)
}
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
  if (BANNED_DEPENDENCIES.test(name)) problems.push(`package.json depends on ${name}`)
}

if (problems.length) {
  console.error(`Backend usage found:\n${problems.join('\n')}`)
  process.exit(1)
}
console.log('NO-BACKEND-OK')
