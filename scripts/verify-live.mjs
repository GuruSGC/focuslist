// The live deployment responds and renders FocusList. The URL is read from deploy.json: { "url": "https://..." }.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { root } from './lib/harness.mjs'

const file = join(root, 'deploy.json')
if (!existsSync(file)) {
  console.error('deploy.json is missing. Deploy the app, then write { "url": "<live url>" } to deploy.json.')
  process.exit(1)
}
const { url } = JSON.parse(readFileSync(file, 'utf8'))
if (!/^https:\/\//.test(url ?? '')) {
  console.error('deploy.json must contain an https url')
  process.exit(1)
}

const response = await fetch(url)
if (response.status !== 200) {
  console.error(`Expected HTTP 200 from ${url}, got ${response.status}`)
  process.exit(1)
}
if (!(await response.text()).includes('FocusList')) {
  console.error('The response does not mention FocusList')
  process.exit(1)
}

let browser
for (const channel of ['chrome', 'msedge']) {
  try {
    browser = await chromium.launch({ channel })
    break
  } catch {
    // Try the next browser.
  }
}
const page = await (await browser.newContext()).newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await page.goto(url)
await page.waitForSelector('#page-title', { timeout: 15000 })
const heading = await page.locator('#page-title').innerText()
await browser.close()
if (heading !== 'Tasks' || errors.length) {
  console.error(`Live app rendered heading "${heading}" with errors: ${errors.join(' | ') || 'none'}`)
  process.exit(1)
}
console.log('LIVE-OK')
