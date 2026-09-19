// Usage: node scripts/verify-motion.mjs <click|instant|discipline|scale|reduced|pages>
// Measures motion in a real browser: what animates on each click, that state stays instant, that pace
// comes from one token, that reduced motion removes movement, and that navigation stays smooth.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { addTask, check, root, rows, run, sampleTasks, settle, stat, withApp } from './lib/harness.mjs'
import { LAYOUT_PROPERTIES, collect, observe, startRecording, summary } from './lib/probe.mjs'

const MIN_MS = 100
const MAX_MS = 300
const VISIBLE = ['transform', 'opacity', 'background-color', 'color', 'border-top-color', 'background-size']
const seeded = { tasks: sampleTasks(3) }

const clickAt = async (page, locator) => {
  const box = await locator.boundingBox()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
}

/** A control counts as animated when a click starts a visible animation of 100-300 ms within 100 ms. */
function assertAnimated(name, result) {
  const usable = result.animations.filter((a) => a.duration >= MIN_MS && a.duration <= MAX_MS && a.properties.some((p) => VISIBLE.includes(p)))
  check(usable.length > 0, `${name}: no visible 100-300 ms animation started (saw: ${result.animations.map(summary).join('; ') || 'nothing'})`)
  const first = Math.min(...usable.map((a) => a.sinceClick ?? 0))
  check(first <= 100, `${name}: the first animation started ${first} ms after the click (limit 100)`)
}

async function freshPage(newPage, options = {}) {
  const page = await newPage({ ...seeded, ...options })
  await settle(page)
  return page
}

const suites = {
  async click({ newPage }) {
    const controls = {
      'Add Task': async (page) => {
        await page.getByLabel('New task').fill('Buy green tea')
        return () => clickAt(page, page.getByRole('button', { name: 'Add Task' }))
      },
      'complete stamp': async (page) => () => clickAt(page, page.getByRole('checkbox', { name: 'Finish the quarterly report' })),
      Edit: async (page) => () => clickAt(page, page.getByRole('button', { name: 'Edit Book train tickets to Kyoto' })),
      Save: async (page) => {
        await page.getByRole('button', { name: 'Edit Book train tickets to Kyoto' }).click()
        await page.locator('form[aria-label="Edit Book train tickets to Kyoto"]').getByLabel('Task title').fill('Book train tickets to Osaka')
        await page.waitForTimeout(400)
        return () => clickAt(page, page.getByRole('button', { name: 'Save' }))
      },
      Cancel: async (page) => {
        await page.getByRole('button', { name: 'Edit Book train tickets to Kyoto' }).click()
        await page.waitForTimeout(400)
        return () => clickAt(page, page.getByRole('button', { name: 'Cancel' }))
      },
      Delete: async (page) => () => clickAt(page, page.getByRole('button', { name: 'Delete Water the bonsai' })),
      Undo: async (page) => {
        await page.getByRole('button', { name: 'Delete Water the bonsai' }).click()
        await page.waitForTimeout(450)
        return () => clickAt(page, page.getByRole('button', { name: 'Undo' }))
      },
      'status filter': async (page) => () => clickAt(page, page.getByRole('button', { name: 'Active' })),
      'priority radio': async (page) => () => clickAt(page, page.locator('form[aria-label="Add a task"] label', { hasText: 'High' })),
      'Clear Filters': async (page) => {
        await page.getByLabel('Search tasks').fill('zzzz')
        await page.waitForTimeout(400)
        return () => clickAt(page, page.getByRole('button', { name: 'Clear Filters' }))
      },
      'theme toggle': async (page) => () => clickAt(page, page.getByTestId('theme-toggle')),
      'nav link': async (page) => () => clickAt(page, page.getByTestId('nav-overview')),
    }
    for (const [name, prepare] of Object.entries(controls)) {
      const page = await freshPage(newPage)
      const act = await prepare(page)
      const result = await observe(page, act, 480)
      assertAnimated(name, result)
      await page.context().close()
    }
  },

  async instant({ newPage }) {
    const page = await freshPage(newPage)
    const running = () => page.evaluate(() => document.getAnimations().some((a) => a.playState === 'running' && a.effect?.getComputedTiming().duration >= 100))

    // Add: the row and the totals are there at once, while the animation is still playing.
    await page.getByLabel('New task').fill('Instant task')
    await clickAt(page, page.getByRole('button', { name: 'Add Task' }))
    check((await rows(page).count()) === 4, 'the new row should exist immediately after clicking Add Task')
    check((await stat(page, 'total')) === 4, 'the total should update immediately')
    check(await running(), 'the add animation should still be running when the state is already correct')

    // Complete two tasks back to back: the second click is accepted mid-animation.
    // Let the rows finish making way for the new task first, so their positions are stable to aim at.
    await page.waitForTimeout(400)
    const first = page.getByRole('checkbox', { name: 'Finish the quarterly report' })
    const second = page.getByRole('checkbox', { name: 'Book train tickets to Kyoto' })
    const secondBox = await second.boundingBox()
    await clickAt(page, first)
    await page.mouse.click(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2 + 4)
    await page.waitForTimeout(60)
    check(await first.isChecked(), 'the first completion should register')
    check(await second.isChecked(), 'a second click during the first animation should also register')

    // Delete: the row is gone from the list at once; the exit is an inert, hidden ghost that removes itself.
    const before = await rows(page).count()
    await clickAt(page, page.getByRole('button', { name: 'Delete Water the bonsai' }))
    check((await rows(page).count()) === before - 1, 'the deleted task should leave the task list immediately')
    const ghost = await page.evaluate(() => {
      const element = document.querySelector('[data-ghost]')
      return element
        ? { hidden: element.getAttribute('aria-hidden') === 'true', inert: element.hasAttribute('inert'), testid: element.querySelector('[data-testid]') !== null || element.hasAttribute('data-testid'), buttons: element.querySelectorAll('button').length }
        : null
    })
    check(ghost !== null, 'a deleted row should leave a ghost for its exit animation')
    check(ghost.hidden && ghost.inert, 'the ghost must be aria-hidden and inert')
    check(!ghost.testid, 'the ghost must not carry test ids that could be counted as a task')
    await page.waitForTimeout(450)
    check((await page.locator('[data-ghost]').count()) === 0, 'the ghost should remove itself after its exit')

    // Undo is accepted while the toast is still arriving, and the row comes back where it was.
    await clickAt(page, page.getByRole('button', { name: 'Undo' }))
    check((await rows(page).count()) === before, 'undo should restore the row immediately')
  },

  async discipline({ newPage }) {
    // Static scan: no transition all, no literal durations outside the token block, none over 300 ms.
    const RULES = [
      [/transition(-property)?\s*:\s*all\b/, 'transition: all'],
      [/\bduration\s*:\s*\d/, 'a literal numeric duration in code'],
    ]
    const durations = (text) => [...text.matchAll(/(\d*\.?\d+)(ms|s)\b/g)].map((m) => (m[2] === 's' ? Number(m[1]) * 1000 : Number(m[1])))
    const scanLine = (line, inTokens) => {
      const problems = RULES.filter(([pattern]) => pattern.test(line)).map(([, name]) => name)
      if (!inTokens && /\btransition|animation|delay/.test(line) && durations(line).length) problems.push('a literal duration outside the motion tokens')
      if (durations(line).some((ms) => ms > MAX_MS) && /--dur|--stagger|duration|transition|animation/.test(line)) problems.push('a duration over 300 ms')
      return problems
    }
    // Negative controls: the scanner must catch each violation or a clean result is meaningless.
    for (const sample of ['transition: all 200ms ease', 'transition: transform 500ms ease', 'el.animate(k, { duration: 200 })']) {
      check(scanLine(sample, false).length > 0, `scanner missed: ${sample}`)
    }
    const files = []
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name)
        if (statSync(path).isDirectory()) walk(path)
        else if (/\.(css|ts|tsx)$/.test(name)) files.push(path)
      }
    }
    walk(join(root, 'src'))
    const problems = []
    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split(/\r?\n/)
      let tokens = false
      lines.forEach((line, index) => {
        if (/@property --(motion|dur|stagger)/.test(line) || /^\s*--(motion-scale|dur-|stagger)/.test(line)) tokens = true
        const found = scanLine(line, tokens || /\binitial-value\b/.test(line))
        if (found.length) problems.push(`${file.replace(root, '')}:${index + 1}: ${found.join(', ')}`)
        if (tokens && /[;}]\s*$/.test(line)) tokens = false
      })
    }
    check(problems.length === 0, `motion discipline violations:\n${problems.join('\n')}`)

    // Runtime: across a full flow nothing runs longer than 300 ms or animates a layout property.
    const page = await freshPage(newPage)
    await startRecording(page)
    await page.getByLabel('New task').fill('Flow task')
    await page.getByRole('button', { name: 'Add Task' }).click()
    await page.getByRole('checkbox', { name: 'Flow task' }).check()
    await page.getByRole('button', { name: 'Active' }).click()
    await page.getByRole('button', { name: 'All', exact: true }).click()
    await page.getByRole('button', { name: 'Edit Flow task' }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await page.getByRole('button', { name: 'Delete Flow task' }).click()
    await page.getByTestId('nav-overview').click()
    await page.getByTestId('theme-toggle').click()
    await page.waitForTimeout(600)
    const flow = await collect(page)
    check(flow.animations.length > 15, `the flow should start plenty of animations (saw ${flow.animations.length})`)
    for (const animation of flow.animations) {
      check(animation.duration <= MAX_MS, `over 300 ms: ${summary(animation)}`)
      check(!animation.properties.some((p) => LAYOUT_PROPERTIES.includes(p) || p === 'all'), `animates a layout property: ${summary(animation)}`)
    }

    // Keyboard shortcuts and typing start no movement or fade.
    const typing = await freshPage(newPage)
    const keyboard = await observe(
      typing,
      async () => {
        await typing.keyboard.press('n')
        await typing.keyboard.press('/')
        await typing.keyboard.type('abc')
      },
      400,
    )
    const moving = keyboard.animations.filter((a) => a.properties.some((p) => p === 'transform' || p === 'opacity'))
    check(moving.length === 0, `shortcuts and typing must not animate movement: ${moving.map(summary).join('; ')}`)
  },

  async scale({ newPage }) {
    const measure = async (scale) => {
      const page = await freshPage(newPage)
      await page.evaluate((value) => document.documentElement.style.setProperty('--motion-scale', String(value)), scale)
      await page.getByLabel('New task').fill('Scaled')
      const result = await observe(page, () => clickAt(page, page.getByRole('button', { name: 'Add Task' })), scale > 1 ? 900 : 500)
      const stateOk = (await rows(page).count()) === 4
      const leftover = await page.locator('.ink').count()
      await page.context().close()
      return { result, stateOk, leftover }
    }
    const find = (result, predicate) => result.animations.find(predicate)
    const base = await measure(1)
    const double = await measure(2)
    const ink = (r) => find(r.result, (a) => a.target.includes('ink'))
    const hover = (r) => find(r.result, (a) => a.kind === 'CSSTransition' && a.properties.includes('background-color') && a.target.includes('btn'))
    check(ink(base) && ink(double), 'the ink bloom should play at scale 1 and 2')
    check(Math.abs(ink(double).duration / ink(base).duration - 2) < 0.1, `doubling --motion-scale should double the ink bloom (${ink(base).duration} then ${ink(double).duration})`)
    check(hover(base) && hover(double), 'the button colour transition should play at scale 1 and 2')
    check(Math.abs(hover(double).duration / hover(base).duration - 2) < 0.1, 'doubling --motion-scale should double CSS transitions too')

    const off = await measure(0)
    check(off.stateOk, 'with --motion-scale 0 the state must still change at once')
    check(off.leftover === 0 && !off.result.animations.some((a) => a.duration > 0 && a.properties.some((p) => p === 'transform')), `with --motion-scale 0 nothing should move (saw ${off.result.animations.map(summary).join('; ')})`)
  },

  async reduced({ newPage }) {
    const page = await freshPage(newPage, { reducedMotion: 'reduce' })
    await startRecording(page)
    await page.getByLabel('New task').fill('Calm task')
    await page.getByRole('button', { name: 'Add Task' }).click()
    check((await rows(page).count()) === 4, 'adding must still work with reduced motion')
    await page.getByRole('checkbox', { name: 'Calm task' }).check()
    await page.locator('form[aria-label="Add a task"] label', { hasText: 'High' }).click()
    await page.getByRole('button', { name: 'Active' }).click()
    await page.getByRole('button', { name: 'All', exact: true }).click()
    await page.getByRole('button', { name: 'Delete Calm task' }).click()
    check((await rows(page).count()) === 3, 'deleting must still work with reduced motion')
    await page.getByTestId('nav-overview').click()
    await page.locator('#page-title', { hasText: 'Overview' }).waitFor()
    await page.getByTestId('theme-toggle').click()
    await page.waitForTimeout(500)
    const result = await collect(page)
    check(result.animations.length > 0, 'confirming fades should remain under reduced motion')
    for (const animation of result.animations) {
      check(!animation.properties.some((p) => p === 'transform'), `reduced motion must not move things: ${summary(animation)}`)
      check(animation.duration <= 150, `reduced-motion feedback should be a short fade: ${summary(animation)}`)
    }
  },

  async pages({ newPage }) {
    const page = await freshPage(newPage)
    const layers = () => page.evaluate(() => [...document.querySelectorAll('.painting')].map((el) => ({ slug: el.dataset.painting, opacity: Number(getComputedStyle(el).opacity) })))
    const expected = { overview: 'ghosts-of-the-taira', guide: 'sudden-shower', tasks: 'great-wave' }
    check(JSON.stringify((await layers()).map((l) => l.slug)) === '["great-wave"]', 'Tasks should start with the Great Wave alone')

    for (const route of ['overview', 'guide', 'tasks']) {
      await startRecording(page)
      await page.getByTestId(`nav-${route}`).click()
      await page.waitForTimeout(90)
      const during = await layers()
      check(during.length === 2, `during the ${route} transition both prints should be present (saw ${during.length})`)
      check(during.at(-1).opacity < 1 && during.at(-1).opacity >= 0, `the incoming print should be mid-fade (opacity ${during.at(-1).opacity})`)
      await page.waitForTimeout(450)
      const after = await layers()
      check(after.length === 1 && after[0].slug === expected[route], `after the ${route} transition exactly the right print should remain (saw ${JSON.stringify(after)})`)
      const result = await collect(page)
      const fade = result.animations.find((a) => a.target.includes('painting') && a.properties.includes('opacity'))
      check(fade && fade.duration <= MAX_MS, `the painting crossfade should be animated within 300 ms (${fade ? summary(fade) : 'missing'})`)
    }

    // Event Timing: every interaction paints quickly (an INP proxy) across a full flow.
    const inp = await freshPage(newPage)
    await inp.evaluate(() => {
      window.__events = []
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (entry.interactionId > 0) window.__events.push({ name: entry.name, duration: entry.duration })
      }).observe({ type: 'event', durationThreshold: 16, buffered: true })
    })
    await addTask(inp, 'Timing task', 'high')
    await inp.getByRole('checkbox', { name: 'Timing task' }).check()
    await inp.getByLabel('Search tasks').fill('timing')
    await inp.getByLabel('Search tasks').fill('')
    await inp.getByRole('button', { name: 'Completed' }).click()
    await inp.getByRole('button', { name: 'All', exact: true }).click()
    await inp.getByRole('button', { name: 'Edit Timing task' }).click()
    await inp.getByRole('button', { name: 'Cancel' }).click()
    await inp.getByRole('button', { name: 'Delete Timing task' }).click()
    await inp.getByTestId('nav-guide').click()
    await inp.getByTestId('theme-toggle').click()
    await inp.waitForTimeout(400)
    const events = await inp.evaluate(() => window.__events)
    const worst = events.reduce((max, event) => Math.max(max, event.duration), 0)
    check(worst <= 200, `an interaction took ${worst} ms to paint (limit 200): ${JSON.stringify(events.filter((e) => e.duration > 200))}`)
  },
}

const name = process.argv[2]
if (!suites[name]) {
  console.error(`Unknown suite "${name}". Choose one of: ${Object.keys(suites).join(', ')}`)
  process.exit(2)
}
await run(`motion:${name}`, `MOTION-${name.toUpperCase()}-OK`, () => withApp(suites[name]))
