// Lighthouse (mobile emulation) against the production build.
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'
import { startServer } from './lib/harness.mjs'

const MINIMUMS = { performance: 0.9, accessibility: 0.95, 'best-practices': 0.95, seo: 0.9 }
const MAX_CLS = 0.05

const server = await startServer()
// Own the profile directory: chrome-launcher's cleanup of its temp profile throws EPERM on Windows.
const profile = mkdtempSync(join(tmpdir(), 'focuslist-lh-'))
const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'], userDataDir: profile })
let failure = null
try {
  const result = await lighthouse(`${server.url}/`, {
    port: chrome.port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: Object.keys(MINIMUMS),
  })
  const { categories, audits } = result.lhr
  const scores = Object.fromEntries(Object.keys(MINIMUMS).map((key) => [key, categories[key].score]))
  const cls = audits['cumulative-layout-shift'].numericValue
  const lcp = audits['largest-contentful-paint'].numericValue
  const tbt = audits['total-blocking-time'].numericValue
  console.log(
    `scores: ${Object.entries(scores)
      .map(([key, value]) => `${key}=${Math.round(value * 100)}`)
      .join(' ')} | CLS=${cls.toFixed(3)} LCP=${Math.round(lcp)}ms TBT=${Math.round(tbt)}ms`,
  )
  const misses = Object.entries(MINIMUMS)
    .filter(([key, minimum]) => scores[key] < minimum)
    .map(([key, minimum]) => `${key} ${Math.round(scores[key] * 100)} < ${minimum * 100}`)
  if (cls > MAX_CLS) misses.push(`CLS ${cls.toFixed(3)} > ${MAX_CLS}`)
  // Animations must stay on the compositor. null means none ran, which also passes.
  const compositor = audits['non-composited-animations']
  if (compositor && compositor.score !== null && compositor.score < 1) misses.push('non-composited animations audit failed')
  if (misses.length) failure = `Below target: ${misses.join('; ')}`
} finally {
  await Promise.resolve(chrome.kill()).catch(() => undefined)
  await server.close()
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
  } catch {
    // Leftover profile files are harmless; they live in the OS temp directory.
  }
}
if (failure) {
  console.error(failure)
  process.exit(1)
}
console.log('LIGHTHOUSE-OK')
