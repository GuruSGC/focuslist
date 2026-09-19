// The Japanese painting theme is really present: motifs, palette tokens, papyrus ground, thick black stroke.
import { check, run, sampleTasks, settle, withApp } from './lib/harness.mjs'

const luminance = ([r, g, b]) => {
  const channel = (value) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

await run('theme', 'THEME-OK', () =>
  withApp(async ({ newPage }) => {
    const page = await newPage({ colorScheme: 'light', tasks: sampleTasks(4) })
    await settle(page)
    const info = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement)
      const tokens = Object.fromEntries(
        ['--paper', '--sumi', '--ai', '--shu', '--brush', '--p-wave-deep', '--p-sun', '--stroke'].map((name) => [name, root.getPropertyValue(name).trim()]),
      )
      const rgb = (value) => value.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number)
      const brushStyle = getComputedStyle(document.querySelector('[data-testid="brush-stroke"] g'))
      const widths = [...document.querySelectorAll('[data-testid="brush-stroke"] path[data-core="true"]')].map((p) => Number(p.getAttribute('stroke-width')))
      return {
        tokens,
        motifs: Object.fromEntries(['sun', 'fuji', 'seigaiha', 'wave', 'pine'].map((m) => [m, document.querySelectorAll(`[data-testid="painting-backdrop"] [data-motif="${m}"]`).length])),
        seals: document.querySelectorAll('.seal').length,
        wordmarkKanji: document.querySelector('.kanji-accent')?.textContent?.trim(),
        ground: rgb(getComputedStyle(document.body).backgroundColor),
        stroke: rgb(brushStyle.stroke),
        strokeThickness: Number.parseFloat(root.getPropertyValue('--stroke')),
        coreCount: widths.length,
        strokeBody: widths.length * (widths[0] ?? 0),
      }
    })
    for (const [name, value] of Object.entries(info.tokens)) check(value !== '', `design token ${name} should resolve`)
    for (const [motif, count] of Object.entries(info.motifs)) check(count >= 1, `painting is missing the ${motif} motif`)
    check(info.seals >= 8, `expected hanko seals on the page (found ${info.seals})`)
    check(info.wordmarkKanji === '集中', 'the wordmark should carry the kanji accent')

    const [r, g, b] = info.ground
    const ground = luminance(info.ground)
    check(ground > 0.65 && ground < 0.9, `ground should be a light papyrus tone (luminance ${ground.toFixed(2)})`)
    check(r >= g && g >= b && r - b > 8, `ground should be warm (rgb ${info.ground.join(',')})`)
    check(luminance(info.stroke) < 0.05, `the brush stroke should be near black in light theme (rgb ${info.stroke.join(',')})`)
    check(info.strokeThickness >= 40, `desktop stroke should be at least 40px thick (got ${info.strokeThickness})`)
    check(info.coreCount >= 10, 'the stroke should be built from many bristles')

    const phone = await newPage({ width: 375, height: 812 })
    const phoneThickness = await phone.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stroke')))
    check(phoneThickness >= 20, `phone stroke should be at least 20px thick (got ${phoneThickness})`)
  }),
)
