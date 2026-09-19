// The motion lab: lets an engineer (or anyone reviewing the work) SEE the animations.
// Usage: node scripts/motion-lab.mjs [name ...]      (no names runs every scene)
// For each scene it slows the page's animation clock to 10 percent (the same as the DevTools
// Animations panel), performs the interaction, films frames, and writes a labelled filmstrip to
// .motion-lab/<scene>.png. It also prints every animation the interaction started, with its
// properties, duration and easing, plus how evenly frames were delivered at normal speed.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { root, sampleTasks, withApp } from './lib/harness.mjs'
import { observe, summary } from './lib/probe.mjs'

const outDir = join(root, '.motion-lab')
mkdirSync(outDir, { recursive: true })

const RATE = 0.1
const FRAMES = 12
const INTERVAL = 150

const center = async (locator) => {
  const box = await locator.boundingBox()
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}
const clickAt = async (page, locator) => {
  const { x, y } = await center(locator)
  await page.mouse.click(x, y)
}
const region = (box, pad, page) => {
  const viewport = page.viewportSize()
  const x = Math.max(0, Math.floor(box.x - pad))
  const y = Math.max(0, Math.floor(box.y - pad))
  return {
    x,
    y,
    width: Math.min(viewport.width - x, Math.ceil(box.width + pad * 2)),
    height: Math.min(viewport.height - y, Math.ceil(box.height + pad * 2)),
  }
}

// Each scene: how to set up the page, what to click, and which part of the screen to film.
const SCENES = {
  'add-task': {
    tasks: 2,
    setup: async (page) => page.getByLabel('New task').fill('Buy green tea'),
    act: (page) => clickAt(page, page.getByRole('button', { name: 'Add Task' })),
    clip: async (page) => region(await page.locator('form[aria-label="Add a task"]').boundingBox(), 10, page),
    extend: 420,
  },
  'press-button': {
    tasks: 1,
    act: (page) => clickAt(page, page.getByRole('button', { name: 'Add Task' })),
    clip: async (page) => region(await page.getByRole('button', { name: 'Add Task' }).boundingBox(), 14, page),
    scale: 3,
  },
  'complete-task': {
    fixed: true,
    tasks: 3,
    act: (page) => clickAt(page, page.getByRole('checkbox', { name: 'Finish the quarterly report' })),
    clip: async (page) => region(await page.getByTestId('task-item').first().boundingBox(), 6, page),
  },
  'delete-task': {
    fixed: true,
    tasks: 4,
    act: (page) => clickAt(page, page.getByRole('button', { name: 'Delete Water the bonsai' })),
    clip: async (page) => {
      const list = await page.getByTestId('task-list').boundingBox()
      return region({ ...list, height: 340 }, 6, page)
    },
  },
  'filter-status': {
    fixed: true,
    tasks: 4,
    act: (page) => clickAt(page, page.getByRole('button', { name: 'Completed' })),
    clip: async (page) => {
      const bar = await page.locator('[role="search"]').boundingBox()
      const list = await page.getByTestId('task-list').boundingBox()
      return region({ x: bar.x, y: bar.y, width: bar.width, height: list.y + 300 - bar.y }, 4, page)
    },
  },
  'pick-priority': {
    tasks: 1,
    act: (page) => clickAt(page, page.locator('form[aria-label="Add a task"] label', { hasText: 'High' })),
    clip: async (page) => region(await page.locator('form[aria-label="Add a task"] .seg').boundingBox(), 10, page),
    scale: 2,
  },
  'edit-task': {
    fixed: true,
    tasks: 3,
    act: (page) => clickAt(page, page.getByRole('button', { name: 'Edit Book train tickets to Kyoto' })),
    clip: async (page) => {
      const list = await page.getByTestId('task-list').boundingBox()
      return region({ ...list, height: 320 }, 6, page)
    },
  },
  'error-shake': {
    fixed: true,
    tasks: 0,
    act: (page) => clickAt(page, page.getByRole('button', { name: 'Add Task' })),
    clip: async (page) => region(await page.locator('form[aria-label="Add a task"] .flex').first().boundingBox(), 26, page),
    scale: 2,
  },
  'theme-toggle': {
    tasks: 3,
    act: (page) => clickAt(page, page.getByTestId('theme-toggle')),
    clip: async (page) => ({ x: 0, y: 0, ...page.viewportSize() }),
    scale: 0.5,
  },
  'nav-overview': {
    tasks: 3,
    act: (page) => clickAt(page, page.getByTestId('nav-overview')),
    clip: async (page) => ({ x: 0, y: 0, ...page.viewportSize() }),
    scale: 0.5,
  },
}

async function filmstrip(page, name, scene) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Animation.enable')
  await cdp.send('Animation.setPlaybackRate', { playbackRate: RATE })
  const frames = []
  // Scenes whose subject moves keep the camera still, so the movement is what you see.
  const fixed = scene.fixed ? await scene.clip(page) : null
  const started = Date.now()
  await scene.act(page)
  for (let i = 0; i < FRAMES; i += 1) {
    const clip = fixed ?? (await scene.clip(page))
    const buffer = await page.screenshot({ clip, scale: 'css' })
    frames.push({ buffer, ms: Math.round((Date.now() - started) * RATE) })
    await page.waitForTimeout(INTERVAL)
  }
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 })

  const cell = 360
  const scaleUp = scene.scale && scene.scale > 1 ? scene.scale : 1
  const images = await Promise.all(
    frames.map(async ({ buffer }) => {
      const resized = await sharp(buffer)
        .resize({ width: cell * (scene.scale && scene.scale < 1 ? 1 : 1), height: 260, fit: 'inside', kernel: scaleUp > 1 ? 'lanczos3' : 'lanczos3' })
        .toBuffer({ resolveWithObject: true })
      return resized
    }),
  )
  const cellHeight = Math.max(...images.map((image) => image.info.height)) + 22
  const columns = 4
  const rows = Math.ceil(frames.length / columns)
  const composites = []
  for (const [index, image] of images.entries()) {
    const left = (index % columns) * (cell + 8)
    const top = Math.floor(index / columns) * (cellHeight + 8)
    composites.push({ input: image.data, left, top: top + 22 })
    const label = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="22"><rect width="100%" height="100%" fill="#111"/><text x="8" y="16" font-family="sans-serif" font-size="14" fill="#fff">${name}  t=${frames[index].ms} ms</text></svg>`,
    )
    composites.push({ input: label, left, top })
  }
  const width = columns * (cell + 8)
  const height = rows * (cellHeight + 8)
  await sharp({ create: { width, height, channels: 3, background: '#333' } })
    .composite(composites)
    .png()
    .toFile(join(outDir, `${name}.png`))
}

const wanted = process.argv.slice(2)
const names = wanted.length ? wanted : Object.keys(SCENES)

await withApp(async ({ newPage }) => {
  for (const name of names) {
    const scene = SCENES[name]
    if (!scene) throw new Error(`Unknown scene "${name}". Choose from: ${Object.keys(SCENES).join(', ')}`)
    const options = { width: 1440, height: 900, tasks: scene.tasks ? sampleTasks(scene.tasks) : [] }

    // 1. Numbers, at normal speed.
    const page = await newPage(options)
    await page.waitForTimeout(900)
    if (scene.setup) await scene.setup(page)
    const recorded = await observe(page, () => scene.act(page), 520)
    console.log(`\n== ${name}`)
    for (const animation of recorded.animations) console.log('  ' + summary(animation))
    console.log(`  frames: ${recorded.frames.count}, longest gap ${recorded.frames.maxGap.toFixed(1)} ms, over 24 ms: ${recorded.frames.over24}`)
    await page.context().close()

    // 2. Pictures, at 10 percent speed.
    const slow = await newPage(options)
    await slow.waitForTimeout(900)
    if (scene.setup) await scene.setup(slow)
    await filmstrip(slow, name, scene)
    await slow.context().close()
  }
})
console.log(`\nFilmstrips are in ${outDir}`)
