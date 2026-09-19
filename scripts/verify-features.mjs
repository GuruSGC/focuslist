// Usage: node scripts/verify-features.mjs <suite>
// Suites: create manage priority filter stats persist distinct theme pages
import { addTask, check, rows, run, sampleTasks, settle, stat, withApp } from './lib/harness.mjs'

const suites = {
  async create({ newPage }) {
    const page = await newPage()
    check(await page.getByTestId('empty-state').isVisible(), 'empty state should show with no tasks')

    const form = page.locator('form[aria-label="Add a task"]')
    await form.getByRole('button', { name: 'Add task' }).click()
    check(await page.getByRole('alert').isVisible(), 'empty title should show an error')
    check((await rows(page).count()) === 0, 'empty title must not create a task')

    await form.getByLabel('New task').fill('   ')
    await form.getByRole('button', { name: 'Add task' }).click()
    check((await rows(page).count()) === 0, 'whitespace title must not create a task')

    await form.getByLabel('New task').fill('x'.repeat(121))
    await form.getByRole('button', { name: 'Add task' }).click()
    check((await rows(page).count()) === 0, 'a 121 character title must be rejected')

    await form.getByLabel('New task').fill('Buy green tea')
    await page.keyboard.press('Enter')
    check((await rows(page).count()) === 1, 'Enter should add the task')
    check((await page.getByTestId('task-title').first().innerText()).trim() === 'Buy green tea', 'task title should be shown')
    check((await form.getByLabel('New task').inputValue()) === '', 'input should clear after adding')
    check(await form.getByLabel('New task').evaluate((el) => el === document.activeElement), 'input should stay focused')
  },

  async manage({ newPage }) {
    const page = await newPage()
    await addTask(page, 'Alpha')
    await addTask(page, 'Beta')
    // Newest first: Beta, Alpha.
    const alpha = page.getByRole('checkbox', { name: 'Alpha' })
    await alpha.check()
    check((await rows(page).nth(1).getAttribute('data-completed')) === 'true', 'toggling should complete the task')
    await alpha.uncheck()
    check((await rows(page).nth(1).getAttribute('data-completed')) === 'false', 'toggling again should reopen the task')

    await page.getByRole('button', { name: 'Edit Alpha' }).click()
    const editForm = page.locator('form[aria-label="Edit Alpha"]')
    await editForm.getByLabel('Task title').fill('Alpha renamed')
    await editForm.locator('label', { hasText: 'High' }).click()
    await page.keyboard.press('Enter')
    check((await page.getByTestId('task-title').nth(1).innerText()).trim() === 'Alpha renamed', 'Enter should save the edit')
    check((await rows(page).nth(1).locator('[data-priority="high"]').count()) === 1, 'edit should change priority')

    await page.getByRole('button', { name: 'Edit Beta' }).click()
    await page.locator('form[aria-label="Edit Beta"]').getByLabel('Task title').fill('Should not stick')
    await page.keyboard.press('Escape')
    check((await page.getByTestId('task-title').first().innerText()).trim() === 'Beta', 'Escape should cancel the edit')
    await page.waitForTimeout(100)
    check(
      await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Edit Beta'),
      'focus should return to the Edit button after cancelling',
    )

    await page.getByRole('button', { name: 'Edit Beta' }).click()
    await page.locator('form[aria-label="Edit Beta"]').getByLabel('Task title').fill('')
    await page.keyboard.press('Enter')
    check(await page.getByRole('alert').isVisible(), 'saving an empty edit should show an error')
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'Delete Beta' }).click()
    check((await rows(page).count()) === 1, 'delete should remove the task')
    check(await page.getByTestId('undo-toast').isVisible(), 'delete should offer undo')
    await page.getByRole('button', { name: 'Undo' }).click()
    check((await rows(page).count()) === 2, 'undo should restore the task')
    check((await page.getByTestId('task-title').first().innerText()).trim() === 'Beta', 'undo should restore the original position')
  },

  async priority({ newPage }) {
    const page = await newPage()
    const form = page.locator('form[aria-label="Add a task"]')
    check(await form.getByRole('radio', { name: 'Medium' }).isChecked(), 'Medium should be the default priority')
    await addTask(page, 'Urgent thing', 'high')
    await addTask(page, 'Normal thing', 'medium')
    await addTask(page, 'Someday thing', 'low')
    const expected = { 'Urgent thing': 'High', 'Normal thing': 'Medium', 'Someday thing': 'Low' }
    for (const [title, label] of Object.entries(expected)) {
      const row = rows(page).filter({ hasText: title })
      check((await row.getByTestId('priority-chip').innerText()).includes(label), `${title} should show ${label} as text`)
    }
    await page.getByRole('button', { name: 'Edit Someday thing' }).click()
    await page.locator('form[aria-label="Edit Someday thing"]').locator('label', { hasText: 'High' }).click()
    await page.keyboard.press('Enter')
    const changed = rows(page).filter({ hasText: 'Someday thing' })
    check((await changed.getByTestId('priority-chip').innerText()).includes('High'), 'priority should be changeable')
  },

  async filter({ newPage }) {
    const page = await newPage({ tasks: sampleTasks(8) })
    const count = async () => (await page.getByTestId('results-count').innerText()).trim()
    check((await count()) === 'Showing 8 of 8 tasks', `unexpected initial count: ${await count()}`)

    await page.getByLabel('Search tasks').fill('  REPORT ')
    check((await rows(page).count()) === 2, 'search should match titles case-insensitively')
    check((await count()) === 'Showing 2 of 8 tasks', 'count should follow the search')

    await page.getByRole('button', { name: 'Completed' }).click()
    check((await rows(page).count()) === 1, 'search plus Completed should narrow to one task')
    await page.getByRole('button', { name: 'Active' }).click()
    check((await rows(page).count()) === 1, 'search plus Active should narrow to one task')

    await page.getByLabel('Search tasks').fill('')
    await page.getByRole('button', { name: 'Completed' }).click()
    check((await rows(page).count()) === 3, 'Completed filter should show the 3 completed tasks')
    await page.getByRole('button', { name: 'All', exact: true }).click()
    await page.getByLabel('Priority', { exact: true }).selectOption('high')
    check((await rows(page).count()) === 2, 'priority filter should show the 2 high tasks')
    await page.getByRole('button', { name: 'Active' }).click()
    check((await rows(page).count()) === 1, 'priority plus status should combine')

    // The list follows the underlying data: completing the visible active task removes it from the Active view.
    await rows(page).first().getByRole('checkbox').click()
    check((await rows(page).count()) === 0, 'the visible list should update when task data changes')
    check(await page.getByTestId('no-results').isVisible(), 'no-results state should appear')
    await page.getByRole('button', { name: 'Clear filters' }).click()
    check((await rows(page).count()) === 8, 'Clear filters should restore every task')
    check((await page.getByLabel('Search tasks').inputValue()) === '', 'Clear filters should clear the search box')
  },

  async stats({ newPage }) {
    const page = await newPage()
    const read = async () => [await stat(page, 'total'), await stat(page, 'completed'), await stat(page, 'pending')]
    check((await read()).join() === '0,0,0', 'stats should start at zero')
    await addTask(page, 'One')
    await addTask(page, 'Two')
    await addTask(page, 'Three')
    check((await read()).join() === '3,0,3', 'stats after adding three tasks')
    await page.getByRole('checkbox', { name: 'Two' }).check()
    check((await read()).join() === '3,1,2', 'stats after completing one task')
    await page.getByRole('button', { name: 'Delete One' }).click()
    check((await read()).join() === '2,1,1', 'stats after deleting a pending task')
    await page.getByRole('button', { name: 'Undo' }).click()
    check((await read()).join() === '3,1,2', 'stats after undoing the delete')

    await page.getByTestId('nav-overview').click()
    await page.waitForSelector('#page-title')
    check((await stat(page, 'total')) === 3 && (await stat(page, 'completed')) === 1 && (await stat(page, 'pending')) === 2, 'Overview should show the same statistics')
    check((await page.getByTestId('overview-percent').innerText()).replace(/\s/g, '') === '33%', 'Overview should show the completion percentage')
  },

  async persist({ newPage }) {
    const page = await newPage()
    await addTask(page, 'Survive a refresh', 'high')
    await addTask(page, 'Also survives')
    await page.getByRole('checkbox', { name: 'Survive a refresh' }).check()
    await page.reload()
    await page.waitForSelector('#page-title')
    check((await rows(page).count()) === 2, 'tasks should survive a reload')
    check(await page.getByRole('checkbox', { name: 'Survive a refresh' }).isChecked(), 'completion should survive a reload')
    check((await rows(page).filter({ hasText: 'Survive a refresh' }).locator('[data-priority="high"]').count()) === 1, 'priority should survive a reload')

    await page.evaluate(() => localStorage.setItem('focuslist:v1', '{definitely not json'))
    await page.reload()
    await page.waitForSelector('#page-title')
    check(await page.getByTestId('empty-state').isVisible(), 'corrupted storage should fall back to an empty list')
    await addTask(page, 'Works after corruption')
    check((await rows(page).count()) === 1, 'the app should keep working after corrupted storage')

    await page.evaluate(() =>
      localStorage.setItem(
        'focuslist:v1',
        JSON.stringify([{ id: 'ok', title: 'Valid', priority: 'low', completed: false, createdAt: 1, updatedAt: 1 }, { id: 5 }, null, 'text']),
      ),
    )
    await page.reload()
    await page.waitForSelector('#page-title')
    check((await rows(page).count()) === 1, 'invalid stored entries should be dropped, valid ones kept')
  },

  async distinct({ newPage }) {
    const page = await newPage({ tasks: sampleTasks(2) })
    const style = (index) =>
      rows(page)
        .nth(index)
        .evaluate((row) => {
          const title = row.querySelector('.strike')
          const stamp = row.querySelector('.stamp')
          const cs = getComputedStyle(row)
          return {
            background: cs.backgroundColor,
            titleColor: getComputedStyle(row.querySelector('.task-title')).color,
            strike: getComputedStyle(title).backgroundSize,
            stamp: getComputedStyle(stamp).backgroundColor,
            checked: row.querySelector('input[type=checkbox]').checked,
          }
        })
    await settle(page)
    const pending = await style(0)
    const done = await style(1)
    check(pending.checked === false && done.checked === true, 'seed data should have one pending and one completed task')
    check(pending.background !== done.background, 'completed rows should have a different background')
    check(pending.titleColor !== done.titleColor, 'completed titles should have a different colour')
    check(pending.strike !== done.strike, 'completed titles should carry a brush strike-through')
    check(pending.stamp !== done.stamp, 'completed rows should show a filled stamp')
  },

  async theme({ newPage }) {
    const page = await newPage({ colorScheme: 'light' })
    const theme = () => page.evaluate(() => document.documentElement.dataset.theme)
    const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    check((await theme()) === 'light', 'should start in light theme when the system is light')
    const lightBackground = await background()
    await page.getByTestId('theme-toggle').click()
    check((await theme()) === 'dark', 'toggle should switch to dark')
    check((await background()) !== lightBackground, 'dark theme should change the background')
    await page.reload()
    await page.waitForSelector('#page-title')
    check((await theme()) === 'dark', 'the chosen theme should persist across reloads')
    await page.getByTestId('theme-toggle').click()
    check((await theme()) === 'light', 'toggle should switch back to light')
  },

  async pages({ newPage, url }) {
    const page = await newPage({ hash: '#/overview' })
    const onPage = (name, why) =>
      page
        .locator('#page-title', { hasText: new RegExp(`^${name}$`) })
        .waitFor({ timeout: 4000 })
        .catch(() => {
          throw new Error(why)
        })
    await onPage('Overview', 'deep link to #/overview should open Overview')
    check((await page.title()) === 'Overview | FocusList', 'document title should follow the page')
    check((await page.getByTestId('nav-overview').getAttribute('aria-current')) === 'page', 'nav should mark the current page')

    await page.getByTestId('nav-guide').click()
    await onPage('Guide', 'nav should open Guide')
    check(page.url().endsWith('#/guide'), 'route should be in the URL hash')
    await page.waitForFunction(() => document.activeElement?.id === 'page-title', null, { timeout: 2000 }).catch(() => {
      throw new Error('focus should move to the page heading after navigating')
    })
    check((await page.title()) === 'Guide | FocusList', 'title should update for Guide')

    await page.goBack()
    await onPage('Overview', 'browser back should return to Overview')
    await page.goForward()
    await onPage('Guide', 'browser forward should return to Guide')

    await page.goto(`${url}/#/does-not-exist`)
    await onPage('Tasks', 'unknown routes should fall back to Tasks')

    await page.getByTestId('nav-guide').click()
    await onPage('Guide', 'nav should open Guide again')
    await page.keyboard.press('n')
    await onPage('Tasks', 'the n shortcut should go to Tasks')
    await page.waitForFunction(() => document.activeElement?.id === 'new-task', null, { timeout: 2000 }).catch(() => {
      throw new Error('the n shortcut should focus the new task field')
    })
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('/')
    await page.waitForFunction(() => document.activeElement?.id === 'search', null, { timeout: 2000 }).catch(() => {
      throw new Error('the / shortcut should focus search')
    })
  },
}

const name = process.argv[2]
if (!suites[name]) {
  console.error(`Unknown suite "${name}". Choose one of: ${Object.keys(suites).join(', ')}`)
  process.exit(2)
}
await run(`features:${name}`, `FEATURE-${name.toUpperCase()}-OK`, () => withApp(suites[name]))
