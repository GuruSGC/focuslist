// Captures the README screenshots from the production build: node scripts/screenshots.mjs
import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { root, sampleTasks, settle, withApp } from './lib/harness.mjs'

const out = join(root, 'docs', 'screenshots')
const review = join(root, '.review', 'review')
mkdirSync(out, { recursive: true })
mkdirSync(review, { recursive: true })

const shots = [
  { name: 'tasks-desktop', width: 1440, height: 900, hash: '#/tasks' },
  { name: 'overview-desktop', width: 1440, height: 900, hash: '#/overview' },
  { name: 'guide-desktop', width: 1440, height: 900, hash: '#/guide' },
  { name: 'tasks-dark-desktop', width: 1440, height: 900, hash: '#/tasks', colorScheme: 'dark' },
  { name: 'tasks-tablet', width: 768, height: 1024, hash: '#/tasks' },
  { name: 'tasks-mobile', width: 375, height: 812, hash: '#/tasks' },
  { name: 'overview-mobile', width: 375, height: 812, hash: '#/overview' },
  { name: 'tasks-dark-mobile', width: 375, height: 812, hash: '#/tasks', colorScheme: 'dark' },
]

await withApp(async ({ newPage }) => {
  for (const { name, width, height, hash, colorScheme = 'light' } of shots) {
    const page = await newPage({ width, height, hash, colorScheme, tasks: sampleTasks(4) })
    await settle(page)
    await page.screenshot({ path: join(out, `${name}.png`) })
    await page.context().close()
  }
})

copyFileSync(join(out, 'tasks-desktop.png'), join(review, 'desktop.png'))
copyFileSync(join(out, 'tasks-mobile.png'), join(review, 'mobile.png'))
console.log(`Wrote ${shots.length} screenshots to docs/screenshots`)
