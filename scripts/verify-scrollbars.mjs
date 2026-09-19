// No visible scrollbar takes width on any page, at any size, even when the content overflows.
// Headless Chrome hides scrollbars by default, which would make this check meaningless, so the browser is
// launched with real (non-overlay) scrollbars, and a control element proves it can actually show one.
import { chromium } from 'playwright'
import { check, run, sampleTasks, startServer } from './lib/harness.mjs'

const PAGES = ['tasks', 'overview', 'guide']
const SIZES = [
  [1440, 900],
  [1366, 768],
  [1024, 768],
  [768, 1024],
  [375, 812],
  [320, 568],
]

async function launch() {
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel, ignoreDefaultArgs: ['--hide-scrollbars'] })
    } catch {
      // Try the next installed browser.
    }
  }
  return chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] })
}

await run('scrollbars', 'SCROLLBARS-OK', async () => {
  const server = await startServer()
  const browser = await launch()
  try {
    // Control: in this browser a scrolling box really does show a scrollbar, so a zero elsewhere means something.
    const control = await (await browser.newContext({ viewport: { width: 800, height: 600 } })).newPage()
    await control.setContent('<div id="box" style="width:120px;height:120px;overflow:scroll"><div style="width:400px;height:400px"></div></div>')
    const controlWidth = await control.evaluate(() => {
      const box = document.getElementById('box')
      return box.offsetWidth - box.clientWidth
    })
    check(controlWidth > 0, `control failed: a scrolling box shows no scrollbar (${controlWidth}px), so this browser cannot prove anything`)

    for (const [width, height] of SIZES) {
      for (const name of PAGES) {
        for (const count of [0, 8]) {
          const context = await browser.newContext({ viewport: { width, height } })
          const page = await context.newPage()
          await page.goto(`${server.url}/`)
          await page.evaluate((tasks) => localStorage.setItem('focuslist:v1', JSON.stringify(tasks)), sampleTasks(count))
          await page.goto(`${server.url}/#/${name}`)
          await page.reload()
          await page.waitForSelector('#page-title')
          await page.waitForTimeout(500)
          const result = await page.evaluate(() => {
            const scrollers = []
            for (const element of document.querySelectorAll('*')) {
              const style = getComputedStyle(element)
              if (/(auto|scroll)/.test(style.overflowY + style.overflowX)) {
                const barX = element.offsetHeight - element.clientHeight - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth)
                const barY = element.offsetWidth - element.clientWidth - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth)
                if (barX > 0.5 || barY > 0.5) scrollers.push(`${element.tagName.toLowerCase()}${element.className ? '.' + String(element.className).split(' ')[0] : ''}`)
              }
            }
            const before = window.scrollY
            window.scrollTo(0, 400)
            const canScroll = document.documentElement.scrollHeight > innerHeight + 2
            const moved = window.scrollY !== before
            return {
              viewportBar: innerWidth - document.documentElement.clientWidth,
              horizontalBar: innerHeight - document.documentElement.clientHeight,
              canScroll,
              moved,
              scrollers,
              overflowX: document.documentElement.scrollWidth > innerWidth,
            }
          })
          const where = `${name} with ${count} tasks at ${width}x${height}`
          check(result.viewportBar === 0, `${where}: a ${result.viewportBar}px vertical scrollbar takes width from the page`)
          check(result.horizontalBar === 0, `${where}: a ${result.horizontalBar}px horizontal scrollbar takes height from the page`)
          check(result.scrollers.length === 0, `${where}: inner scroll areas show scrollbars: ${result.scrollers.join(', ')}`)
          check(!result.overflowX, `${where}: the page scrolls sideways`)
          if (result.canScroll) check(result.moved, `${where}: the page is taller than the screen but does not scroll`)
          await context.close()
        }
      }
    }
  } finally {
    await browser.close()
    await server.close()
  }
})
