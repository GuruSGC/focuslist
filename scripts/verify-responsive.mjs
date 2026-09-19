// Usage: node scripts/verify-responsive.mjs [fit]
//   (no argument) no horizontal overflow and reachable controls on every page at 375, 768 and 1440 px
//   fit           the main pages fit the viewport without vertical scrolling in normal use
import { check, run, sampleTasks, settle, withApp } from './lib/harness.mjs'

const PAGES = ['tasks', 'overview', 'guide']

const suites = {
  async responsive({ newPage }) {
    for (const [width, height] of [
      [375, 812],
      [768, 1024],
      [1440, 900],
    ]) {
      for (const name of PAGES) {
        const page = await newPage({ width, height, hash: `#/${name}`, tasks: sampleTasks(4) })
        await settle(page)
        const result = await page.evaluate(() => {
          const problems = []
          if (document.documentElement.scrollWidth > innerWidth) problems.push('page scrolls horizontally')
          for (const element of document.querySelectorAll('.shell a, .shell button, .shell input, .shell select')) {
            const rect = element.getBoundingClientRect()
            if (rect.width <= 2 || rect.height <= 2) continue // screen-reader-only until focused (skip link)
            const label = element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 24) || element.id || element.tagName
            if (rect.left < -0.5 || rect.right > innerWidth + 0.5) problems.push(`"${label}" is outside the viewport horizontally`)
            const interactive = element.matches('a, button, select, input[type="text"], input[type="search"]')
            if (interactive && rect.height < 43.5) problems.push(`"${label}" is shorter than a 44px touch target (${Math.round(rect.height)}px)`)
          }
          return [...new Set(problems)]
        })
        check(result.length === 0, `${name} at ${width}px: ${result.join('; ')}`)
        if (name === 'tasks') {
          for (const control of ['#new-task', '#search', '#priority-filter']) {
            check(await page.locator(control).isVisible(), `${control} should be visible at ${width}px`)
          }
          check(await page.getByRole('button', { name: 'Add task' }).isVisible(), `Add task should be visible at ${width}px`)
        }
      }
    }
  },

  async fit({ newPage }) {
    const cases = [
      { width: 1440, height: 900, pages: ['tasks', 'overview'], counts: [0, 4] },
      { width: 1366, height: 768, pages: ['tasks', 'overview'], counts: [0, 4] },
      { width: 375, height: 812, pages: ['tasks'], counts: [0] },
    ]
    for (const { width, height, pages, counts } of cases) {
      for (const name of pages) {
        for (const count of counts) {
          const page = await newPage({ width, height, hash: `#/${name}`, tasks: sampleTasks(count) })
          await settle(page)
          const { scrollHeight, innerHeight } = await page.evaluate(() => ({
            scrollHeight: document.documentElement.scrollHeight,
            innerHeight: window.innerHeight,
          }))
          check(scrollHeight <= innerHeight + 1, `${name} with ${count} tasks at ${width}x${height} scrolls (${scrollHeight}px > ${innerHeight}px)`)
        }
      }
    }
  },
}

const mode = process.argv[2] ?? 'responsive'
if (!suites[mode]) {
  console.error(`Unknown mode "${mode}". Use no argument or "fit".`)
  process.exit(2)
}
await run(`responsive:${mode}`, mode === 'fit' ? 'FIT-OK' : 'RESPONSIVE-OK', () => withApp(suites[mode]))
