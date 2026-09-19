// Japanese fonts are applied, kanji carry lang="ja", and font transfer stays small.
import { check, run, sampleTasks, settle, withApp } from './lib/harness.mjs'

const BUDGET_BYTES = 250 * 1024

await run('fonts', 'FONTS-OK', () =>
  withApp(async ({ newPage, url, browser }) => {
    const fontBytes = []
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    page.on('response', async (response) => {
      const type = response.headers()['content-type'] ?? ''
      if (type.includes('font') || /\.woff2?(\?|$)/.test(response.url())) {
        fontBytes.push((await response.body().catch(() => Buffer.alloc(0))).length)
      }
    })
    await page.goto(`${url}/`)
    await page.waitForSelector('#page-title')
    await page.evaluate(() => document.fonts.ready)
    await settle(page)

    const total = fontBytes.reduce((sum, size) => sum + size, 0)
    check(total > 0, 'expected to observe font downloads')
    check(total <= BUDGET_BYTES, `fonts transferred ${(total / 1024).toFixed(1)} KB, over the ${BUDGET_BYTES / 1024} KB budget`)

    const info = await page.evaluate(async () => {
      const family = (selector) => getComputedStyle(document.querySelector(selector)).fontFamily
      const loaded = [...document.fonts].filter((face) => face.status === 'loaded').map((face) => `${face.family}`)
      const cjk = /[぀-ヿ一-鿿]/
      const missingLang = []
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (cjk.test(node.textContent) && !node.parentElement.closest('[lang^="ja"]')) missingLang.push(node.textContent.trim())
      }
      return {
        display: family('.wordmark'),
        body: family('body'),
        accent: family('.kanji-accent'),
        loaded: [...new Set(loaded)],
        display700: document.fonts.check('700 16px "Shippori Mincho B1"'),
        body400: document.fonts.check('16px "Zen Kaku Gothic New"'),
        kanji: document.fonts.check('16px "Yuji Syuku"', '集中'),
        missingLang,
        hasKanji: !!document.querySelector('.kanji-accent')?.textContent?.match(cjk),
      }
    })
    check(info.display.includes('Shippori Mincho B1'), `wordmark should use Shippori Mincho B1 (got ${info.display})`)
    check(info.body.includes('Zen Kaku Gothic New'), `body should use Zen Kaku Gothic New (got ${info.body})`)
    check(info.accent.includes('Yuji Syuku'), `kanji accents should use Yuji Syuku (got ${info.accent})`)
    for (const family of ['Shippori Mincho B1', 'Zen Kaku Gothic New', 'Yuji Syuku']) {
      check(info.loaded.includes(family), `${family} should be loaded (loaded: ${info.loaded.join(', ')})`)
    }
    check(info.display700 && info.body400 && info.kanji, 'document.fonts.check should pass for all three families')
    check(info.hasKanji, 'the wordmark accent should contain kanji')
    check(info.missingLang.length === 0, `kanji outside lang="ja": ${info.missingLang.join(', ')}`)

    // Priority seals and stat seals render kanji too; make sure they are covered once tasks exist.
    const withTasks = await newPage({ tasks: sampleTasks(4) })
    await settle(withTasks)
    const uncovered = await withTasks.evaluate(() =>
      [...document.querySelectorAll('.seal')].filter((seal) => !seal.closest('[lang^="ja"]')).length,
    )
    check(uncovered === 0, `${uncovered} seals are missing lang="ja"`)
  }),
)
