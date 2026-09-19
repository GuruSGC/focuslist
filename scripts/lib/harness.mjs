// Shared harness for the verification scripts that back GATES.md.
// It serves the production build with Vite's preview API and drives the installed Chrome.
import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, preview } from 'vite'
import { chromium } from 'playwright'

export const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const newestMtime = (path) => {
  if (!existsSync(path)) return 0
  const stat = statSync(path)
  if (!stat.isDirectory()) return stat.mtimeMs
  return readdirSync(path).reduce((max, name) => Math.max(max, newestMtime(join(path, name))), 0)
}

/** Rebuilds dist when any source file is newer than the last build. */
export async function ensureBuild() {
  const built = newestMtime(join(root, 'dist', 'index.html'))
  const source = Math.max(
    newestMtime(join(root, 'src')),
    newestMtime(join(root, 'index.html')),
    newestMtime(join(root, 'public')),
    newestMtime(join(root, 'vite.config.ts')),
  )
  if (built < source) await build({ root, logLevel: 'silent' })
}

export async function startServer() {
  await ensureBuild()
  const server = await preview({ root, logLevel: 'silent', preview: { port: 0, host: '127.0.0.1', open: false } })
  const url = server.resolvedUrls?.local?.[0] ?? `http://127.0.0.1:${server.config.preview.port}/`
  return { url: url.replace(/\/$/, ''), close: () => new Promise((resolve) => server.httpServer.close(resolve)) }
}

async function launch() {
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel })
    } catch {
      // Try the next installed browser.
    }
  }
  return chromium.launch()
}

/**
 * Runs `fn({ url, browser, newPage })` against the built app, then cleans up.
 * `newPage(options)` opens a page with the given viewport, colour scheme and motion preference,
 * starts from an empty localStorage, and collects page errors.
 */
export async function withApp(fn) {
  const server = await startServer()
  const browser = await launch()
  const errors = []
  const newPage = async ({ width = 1440, height = 900, colorScheme = 'light', reducedMotion = 'no-preference', hash = '', tasks } = {}) => {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme, reducedMotion })
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${server.url}/`)
    await page.evaluate(
      ([saved]) => {
        localStorage.clear()
        if (saved) localStorage.setItem('focuslist:v1', JSON.stringify(saved))
      },
      [tasks ?? null],
    )
    await page.goto(`${server.url}/${hash}`)
    await page.reload()
    await page.waitForSelector('#page-title')
    return page
  }
  try {
    await fn({ url: server.url, browser, newPage, errors })
    if (errors.length) throw new Error(`Uncaught page errors: ${errors.join(' | ')}`)
  } finally {
    await browser.close()
    await server.close()
  }
}

export function check(condition, message) {
  if (!condition) throw new Error(message)
}

export const sampleTasks = (count = 4) => {
  const titles = [
    ['Finish the quarterly report', 'high', false],
    ['Water the bonsai', 'low', true],
    ['Book train tickets to Kyoto', 'medium', false],
    ['Reply to Hiroshi about the lantern festival', 'high', true],
    ['Grind fresh ink for the week', 'low', false],
    ['Plan Sunday tea gathering', 'medium', false],
    ['Renew library card', 'low', false],
    ['Write the report summary', 'medium', true],
  ]
  const now = Date.now()
  return titles.slice(0, count).map(([title, priority, completed], i) => ({
    id: `seed-${i}`,
    title,
    priority,
    completed,
    createdAt: now - (titles.length - i) * 1000,
    updatedAt: now - (titles.length - i) * 1000,
  }))
}

/** Adds a task through the real form. */
export async function addTask(page, title, priority = 'medium') {
  const form = page.locator('form[aria-label="Add a task"]')
  await form.getByLabel('New task').fill(title)
  const label = { high: 'High', medium: 'Medium', low: 'Low' }[priority]
  await form.locator('label', { hasText: label }).click()
  await form.getByRole('button', { name: 'Add task' }).click()
}

export const rows = (page) => page.locator('[data-testid="task-item"]')
export const stat = async (page, key) => Number(await page.locator(`[data-testid="stat-${key}-value"]`).first().innerText())

/** Waits for the page-load and painting transitions to finish. */
export const settle = (page) => page.waitForTimeout(1000)

export async function run(name, marker, fn) {
  try {
    await fn()
    console.log(marker)
  } catch (error) {
    console.error(`${name} FAILED: ${error.message}`)
    process.exit(1)
  }
}
