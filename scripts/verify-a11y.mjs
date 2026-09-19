// Usage: node scripts/verify-a11y.mjs <axe|keyboard>
import AxeBuilder from '@axe-core/playwright'
import { addTask, check, rows, run, sampleTasks, settle, withApp } from './lib/harness.mjs'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

const suites = {
  async axe({ newPage }) {
    for (const colorScheme of ['light', 'dark']) {
      for (const name of ['tasks', 'overview', 'guide']) {
        for (const tasks of [[], sampleTasks(4)]) {
          const page = await newPage({ colorScheme, hash: `#/${name}`, tasks })
          await settle(page)
          const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
          const blocking = violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
          check(
            blocking.length === 0,
            `${colorScheme} ${name} (${tasks.length} tasks): ${blocking
              .map((v) => `${v.id} [${v.impact}] on ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(', ')}`)
              .join('; ')}`,
          )
        }
      }
    }
  },

  async keyboard({ newPage }) {
    const page = await newPage({ tasks: sampleTasks(2) })
    await settle(page)

    // Every interactive control is reachable with Tab and shows a visible focus ring.
    const seen = new Set()
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab')
      const info = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return null
        // Native checkboxes and radios are visually replaced; the ring is drawn on their stamp or label.
        const ring = el.matches('input[type="checkbox"]')
          ? el.nextElementSibling
          : el.matches('input[type="radio"]')
            ? el.closest('label')
            : el
        const cs = getComputedStyle(ring)
        return {
          name:
            el.getAttribute('aria-label') ||
            (el.matches('input, select, textarea') ? el.id || el.getAttribute('name') : el.textContent?.trim()) ||
            el.tagName,
          visible: cs.outlineStyle !== 'none' && Number.parseFloat(cs.outlineWidth) >= 2,
        }
      })
      if (!info) continue
      check(info.visible, `"${info.name}" has no visible focus ring`)
      seen.add(info.name)
    }
    for (const expected of ['Skip to content', 'Tasks', 'Overview', 'Guide', 'new-task', 'Add task', 'search', 'All', 'Active', 'Completed', 'priority-filter']) {
      check([...seen].some((name) => name.includes(expected)), `Tab order should reach "${expected}"`)
    }
    check([...seen].some((name) => name.startsWith('Edit ')) && [...seen].some((name) => name.startsWith('Delete ')), 'Tab order should reach Edit and Delete')

    // Full flow by keyboard alone.
    await page.locator('body').click({ position: { x: 2, y: 2 } })
    await page.keyboard.press('n')
    await page.keyboard.type('Keyboard only task')
    await page.keyboard.press('Enter')
    check((await rows(page).count()) === 3, 'a task should be addable by keyboard')

    const checkbox = page.getByRole('checkbox', { name: 'Keyboard only task' })
    await checkbox.focus()
    await page.keyboard.press('Space')
    check(await checkbox.isChecked(), 'Space should complete a task')

    await page.getByRole('button', { name: 'Edit Keyboard only task' }).focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Control+a')
    await page.keyboard.type('Renamed by keyboard')
    await page.keyboard.press('Enter')
    check((await rows(page).filter({ hasText: 'Renamed by keyboard' }).count()) === 1, 'a task should be editable by keyboard')

    await page.getByRole('button', { name: 'Delete Renamed by keyboard' }).focus()
    await page.keyboard.press('Enter')
    check((await rows(page).count()) === 2, 'a task should be deletable by keyboard')
    await page.getByRole('button', { name: 'Undo' }).focus()
    await page.keyboard.press('Enter')
    check((await rows(page).count()) === 3, 'undo should work by keyboard')

    await addTask(page, 'Mouse added')
    check((await rows(page).count()) === 4, 'the form should still work after keyboard use')
  },
}

const name = process.argv[2]
if (!suites[name]) {
  console.error(`Unknown suite "${name}". Choose one of: ${Object.keys(suites).join(', ')}`)
  process.exit(2)
}
await run(`a11y:${name}`, `A11Y-${name.toUpperCase()}-OK`, () => withApp(suites[name]))
