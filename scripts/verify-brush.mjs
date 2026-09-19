// Usage: node scripts/verify-brush.mjs <scroll|decorative|reduced|pages>
// Measures the brush stroke from the DOM (dash offsets and path geometry), not from the component's own claims.
import { check, run, sampleTasks, settle, withApp } from './lib/harness.mjs'

/** Reads the painted state of the core (solid body) bristles. */
const measure = (page) =>
  page.evaluate(() => {
    const svg = document.querySelector('[data-testid="brush-stroke"]')
    // The unbroken centre bristles run the whole length, so they show exactly where the brush is.
    const centres = [...svg.querySelectorAll('path[data-center="true"]')]
    const reveals = centres.map((path) => 1 - Number.parseFloat(path.style.strokeDashoffset || '1'))
    const mean = reveals.reduce((sum, value) => sum + value, 0) / reveals.length
    const middle = centres[Math.floor(centres.length / 2)]
    const reveal = 1 - Number.parseFloat(middle.style.strokeDashoffset || '1')
    const tip = reveal > 0.001 ? middle.getPointAtLength(reveal * middle.getTotalLength()) : { x: NaN, y: NaN }
    return { mean, tip: { x: tip.x, y: tip.y }, progress: Number(svg.getAttribute('data-progress')) }
  })

const suites = {
  async scroll({ newPage }) {
    const size = { width: 1280, height: 700 }
    const empty = await newPage(size)
    await settle(empty)
    check(
      await empty.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 2),
      'an empty Tasks page should fit the viewport for this test',
    )
    const full = (await measure(empty)).mean

    const page = await newPage({ ...size, tasks: sampleTasks(8) })
    await settle(page)
    check(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 100), 'eight tasks should make the page scroll')
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)

    const at = async (y) => {
      await page.evaluate((top) => window.scrollTo(0, top), y)
      await page.waitForTimeout(250)
      return (await measure(page)).mean
    }
    const start = await at(0)
    const samples = []
    for (const share of [0.25, 0.5, 0.75, 1]) samples.push(await at(max * share))
    check(start > 0.05, `the stroke should already be visible at scroll 0 (got ${start.toFixed(3)})`)
    check(start < full - 0.03, `the stroke should not be fully extended at scroll 0 on a scrollable page (${start.toFixed(3)} vs ${full.toFixed(3)})`)
    let previous = start
    for (const value of samples) {
      check(value > previous + 0.004, `painted length should grow with scroll (${previous.toFixed(3)} then ${value.toFixed(3)})`)
      previous = value
    }
    check(Math.abs(previous - full) < 0.02, `at the bottom the stroke should reach the page's full extent (${previous.toFixed(3)} vs ${full.toFixed(3)})`)

    const back = await at(max * 0.5)
    check(back < samples[3] - 0.004 && Math.abs(back - samples[1]) < 0.01, 'scrolling back up should shrink the stroke by the same amount')
    const top = await at(0)
    check(Math.abs(top - start) < 0.005, 'returning to the top should return to the starting length')
  },

  async decorative({ newPage }) {
    for (const [width, height] of [
      [1440, 900],
      [375, 812],
    ]) {
      const page = await newPage({ width, height, tasks: sampleTasks(3) })
      await settle(page)
      const result = await page.evaluate(() => {
        const problems = []
        const brush = document.querySelector('[data-testid="brush-stroke"]')
        const painting = document.querySelector('[data-testid="painting-backdrop"]')
        for (const [name, element] of [
          ['brush stroke', brush],
          ['painting', painting],
        ]) {
          if (!element) problems.push(`${name} is missing`)
          else {
            if (element.getAttribute('aria-hidden') !== 'true') problems.push(`${name} should be aria-hidden`)
            if (getComputedStyle(element).pointerEvents !== 'none') problems.push(`${name} should ignore pointer events`)
          }
        }
        const z = (element) => Number.parseInt(getComputedStyle(element).zIndex, 10) || 0
        const shell = document.querySelector('.shell')
        if (!(z(shell) > z(brush) && z(brush) > z(painting))) problems.push('stacking order should be shell above brush above painting')

        const style = getComputedStyle(document.documentElement)
        const px = (name) => Number.parseFloat(style.getPropertyValue(name))
        const laneL = px('--lane-l')
        const laneR = px('--lane-r')
        const laneB = px('--lane-b')
        const scrollable = document.documentElement.scrollHeight > innerHeight + 2
        const targets = shell.querySelectorAll('a, button, input, select, h1, h2, p, dt, dd, label, li')
        for (const element of targets) {
          const rect = element.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) continue
          // Native checkboxes and radios are deliberately hidden; their stamp or label is what people see.
          const hiddenNative = element.matches('input[type="checkbox"], input[type="radio"]')
          if (rect.left < laneL - 1) problems.push(`${element.tagName} overlaps the left stroke lane`)
          if (rect.right > innerWidth - laneR + 1) problems.push(`${element.tagName} overlaps the right stroke lane`)
          if (!scrollable && rect.bottom > innerHeight - laneB + 1) problems.push(`${element.tagName} overlaps the bottom stroke lane`)
          let node = hiddenNative ? null : element
          while (node && node !== document.body) {
            const cs = getComputedStyle(node)
            if (cs.visibility === 'hidden' || Number.parseFloat(cs.opacity) < 1) {
              problems.push(`${element.tagName} is not fully visible on first paint`)
              break
            }
            node = node.parentElement
          }
        }
        return [...new Set(problems)]
      })
      check(result.length === 0, `at ${width}px: ${result.join('; ')}`)
    }
  },

  async reduced({ newPage }) {
    const page = await newPage({ reducedMotion: 'reduce', tasks: sampleTasks(2) })
    await page.waitForTimeout(150)
    const settled = await measure(page)
    check(settled.progress > 0.05, 'the stroke should be painted immediately when motion is reduced')
    const animations = await page.evaluate(() => document.getAnimations().length)
    check(animations === 0, `no animations or transitions should be running (found ${animations})`)

    await page.getByTestId('nav-overview').click()
    await page.locator('#page-title', { hasText: 'Overview' }).waitFor()
    await page.waitForTimeout(60)
    const early = (await measure(page)).progress
    await page.waitForTimeout(900)
    const late = (await measure(page)).progress
    check(early > settled.progress + 0.05, 'the stroke should jump to the Overview segment')
    check(Math.abs(early - late) < 0.0005, `the stroke must not animate on page change when motion is reduced (${early} then ${late})`)
    check((await page.evaluate(() => document.getAnimations().length)) === 0, 'no animations after navigating')
  },

  async pages({ newPage }) {
    const size = { width: 1440, height: 900 }
    // Lane sizes at 1440px wide, from the CSS custom properties in src/index.css.
    const laneL = 96
    const laneR = 96
    const laneB = 72
    const page = await newPage(size)
    await settle(page)
    const tasks = await measure(page)
    check(Math.abs(tasks.tip.x - laneL / 2) < 26, `on Tasks the brush should be in the left lane (x=${tasks.tip.x.toFixed(0)})`)
    check(tasks.tip.y > 250 && tasks.tip.y < size.height, `on Tasks the brush should have travelled down (y=${tasks.tip.y.toFixed(0)})`)

    const go = async (name, heading) => {
      await page.getByTestId(`nav-${name}`).click()
      await page.locator('#page-title', { hasText: heading }).waitFor()
      await settle(page)
      return measure(page)
    }

    const overview = await go('overview', 'Overview')
    check(overview.progress > tasks.progress + 0.15, 'Overview should advance the stroke')
    check(overview.tip.x > size.width * 0.6, `on Overview the brush should have turned right (x=${overview.tip.x.toFixed(0)})`)
    check(Math.abs(overview.tip.y - (size.height - laneB / 2)) < 28, `on Overview the brush should run along the bottom lane (y=${overview.tip.y.toFixed(0)})`)

    const guide = await go('guide', 'Guide')
    check(guide.progress > 0.97, 'Guide should complete the stroke')
    check(Math.abs(guide.tip.x - (size.width - laneR / 2)) < 60, `on Guide the brush should be in the right lane (x=${guide.tip.x.toFixed(0)})`)
    check(guide.tip.y < size.height * 0.5, `on Guide the brush should have turned up (y=${guide.tip.y.toFixed(0)})`)
    check(guide.tip.y > 40, `on Guide the up-leg should stop short of the top so the stroke never closes into a frame (y=${guide.tip.y.toFixed(0)})`)

    const back = await go('tasks', 'Tasks')
    check(back.progress < 0.5 && Math.abs(back.tip.x - laneL / 2) < 26, 'navigating back should retract the stroke to the left lane')
    check(await page.getByTestId('brush-stroke').getAttribute('data-page') === 'tasks', 'the stroke should know the current page')

    // The advance is animated: shortly after clicking, the stroke is between the two segments.
    await page.getByTestId('nav-overview').click()
    await page.waitForTimeout(120)
    const mid = (await measure(page)).progress
    check(mid > back.progress && mid < overview.progress - 0.01, `the stroke should be mid-tween shortly after navigating (${mid.toFixed(3)})`)
  },
}

const name = process.argv[2]
if (!suites[name]) {
  console.error(`Unknown suite "${name}". Choose one of: ${Object.keys(suites).join(', ')}`)
  process.exit(2)
}
await run(`brush:${name}`, `BRUSH-${name.toUpperCase()}-OK`, () => withApp(suites[name]))
