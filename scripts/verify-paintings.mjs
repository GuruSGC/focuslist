// Each page shows a real Met public-domain print, shipped as small optimised local files.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { check, root, run, sampleTasks, settle, withApp } from './lib/harness.mjs'

const BUDGET = 250 * 1024
const EXPECTED = { tasks: 'great-wave', overview: 'ghosts-of-the-taira', guide: 'sudden-shower' }

const isPublicDomain = async (id) => {
  const response = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`)
  if (!response.ok) throw new Error(`Met API returned ${response.status} for ${id}`)
  return (await response.json()).isPublicDomain === true
}

await run('paintings', 'PAINTINGS-OK', async () => {
  // 1. Files on disk: both formats per crop, each within budget.
  const dir = join(root, 'src', 'assets', 'art')
  const files = readdirSync(dir)
  for (const slug of Object.values(EXPECTED)) {
    for (const crop of ['desktop', 'mobile']) {
      for (const format of ['avif', 'webp']) {
        const name = `${slug}-${crop}.${format}`
        check(files.includes(name), `missing ${name}`)
        const size = statSync(join(dir, name)).size
        check(size <= BUDGET, `${name} is ${(size / 1024).toFixed(0)} KB, over the ${BUDGET / 1024} KB budget`)
      }
    }
  }

  // 2. Credits: every object id in the data file is flagged public domain by the Met. The check is
  //    proven able to fail by asking about an object that is NOT public domain (a Monet).
  const data = readFileSync(join(root, 'src', 'data', 'paintings.ts'), 'utf8')
  const ids = [...data.matchAll(/\bid:\s*(\d+)/g)].map((match) => Number(match[1]))
  check(ids.length === 3, `expected 3 paintings in the data file, found ${ids.length}`)
  check((await isPublicDomain(437133)) === false, 'negative control failed: the API should report the Monet as not public domain')
  for (const id of ids) check(await isPublicDomain(id), `Met object ${id} is not flagged public domain`)
  check(/creditLine/.test(data) && /objectUrl/.test(data), 'the data file should carry credit lines and object URLs')

  // 3. In the browser: the right print per page, decoded at a sensible size, hidden from assistive tech.
  await withApp(async ({ newPage }) => {
    for (const [route, slug] of Object.entries(EXPECTED)) {
      for (const [width, height, label, minWidth] of [
        [1440, 900, 'desktop', 1200],
        [375, 812, 'phone', 700],
      ]) {
        const page = await newPage({ width, height, hash: `#/${route}`, tasks: sampleTasks(3) })
        await settle(page)
        const info = await page.evaluate(() => {
          const layers = [...document.querySelectorAll('.painting')]
          const img = layers[0]?.querySelector('img')
          const backdrop = document.querySelector('[data-testid="painting-backdrop"]')
          const panel = document.querySelector('.panel').getBoundingClientRect()
          const after = getComputedStyle(layers[0], '::after').backgroundColor
          return {
            count: layers.length,
            slug: layers[0]?.dataset.painting,
            src: img?.currentSrc ?? '',
            complete: img?.complete,
            natural: img?.naturalWidth ?? 0,
            alt: img?.getAttribute('alt'),
            dimensions: img ? [img.getAttribute('width'), img.getAttribute('height')] : [],
            hidden: backdrop?.getAttribute('aria-hidden'),
            pointer: getComputedStyle(layers[0]).pointerEvents,
            panelLeft: panel.left,
            panelTop: panel.top,
            viewport: [innerWidth, innerHeight],
            veil: after,
          }
        })
        const where = `${route} at ${label}`
        check(info.count === 1 && info.slug === slug, `${where}: expected only ${slug}, saw ${info.count} layer(s) of ${info.slug}`)
        check(info.complete && info.natural >= minWidth, `${where}: the print should be decoded at least ${minWidth}px wide (got ${info.natural})`)
        check(/\.avif(\?|$)/.test(info.src), `${where}: Chrome should be served the AVIF file (got ${info.src})`)
        check(info.alt === '' && info.hidden === 'true' && info.pointer === 'none', `${where}: the print must be decorative (alt empty, aria-hidden, no pointer events)`)
        check(info.dimensions.every((value) => Number(value) > 0), `${where}: the image needs width and height attributes to prevent layout shift`)
        if (label === 'desktop') check(info.panelLeft / info.viewport[0] >= 0.3, `${where}: the print should be visible beside the panel (panel starts at ${Math.round((info.panelLeft / info.viewport[0]) * 100)}% of the width)`)
        else check(info.panelTop >= 0.15 * info.viewport[1], `${where}: the print should be visible above the panel (panel starts ${Math.round(info.panelTop)} px down)`)
        await page.context().close()
      }
    }

    // Night dims the print under a veil so the interface stays legible.
    const night = await newPage({ colorScheme: 'dark', tasks: sampleTasks(3) })
    await settle(night)
    const veil = await night.evaluate(() => Number(getComputedStyle(document.querySelector('.painting'), '::after').opacity))
    check(veil > 0.3, `the night theme should veil the print (veil opacity ${veil})`)
    const day = await newPage({ colorScheme: 'light', tasks: sampleTasks(3) })
    await settle(day)
    const dayVeil = await day.evaluate(() => Number(getComputedStyle(document.querySelector('.painting'), '::after').opacity))
    check(dayVeil === 0, `the day theme should show the print unveiled (veil opacity ${dayVeil})`)

    // The Guide credits all three prints with links to the Met.
    const guide = await newPage({ hash: '#/guide' })
    await settle(guide)
    const credits = await guide.getByTestId('credits').locator('a').evaluateAll((links) => links.map((link) => link.href))
    check(credits.length === 3 && credits.every((href) => href.startsWith('https://www.metmuseum.org/')), `the Guide should link all three prints to the Met (got ${credits.join(', ')})`)
  })
})
