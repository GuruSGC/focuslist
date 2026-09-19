// Records what animates when something happens on the page: every new animation (CSS transition,
// CSS animation or Web Animation) with its target, properties, duration and easing, plus frame timing.
// Shared by scripts/verify-motion.mjs (the gates) and scripts/motion-lab.mjs (the filmstrips).

/** Installs the recorder in the page. Call `collect` afterwards to read and stop it. */
export async function startRecording(page) {
  await page.evaluate(() => {
    const describeTarget = (element) => {
      if (!element) return 'unknown'
      const testid = element.getAttribute?.('data-testid')
      const cls = typeof element.className === 'string' ? element.className.trim().split(/\s+/).slice(0, 2).join('.') : ''
      return `${element.tagName?.toLowerCase() ?? '?'}${cls ? '.' + cls : ''}${testid ? `[${testid}]` : ''}`
    }
    const describe = (animation) => {
      const effect = animation.effect
      const timing = effect?.getComputedTiming?.() ?? {}
      const keyframes = effect?.getKeyframes?.() ?? []
      const properties = animation.transitionProperty
        ? [animation.transitionProperty]
        : [...new Set(keyframes.flatMap((frame) => Object.keys(frame).filter((key) => !['offset', 'easing', 'composite', 'computedOffset'].includes(key))))]
      return {
        kind: animation.constructor.name,
        target: describeTarget(effect?.target),
        pseudo: effect?.pseudoElement ?? null,
        properties,
        duration: typeof timing.duration === 'number' ? timing.duration : 0,
        delay: timing.delay ?? 0,
        easing: effect?.getTiming?.().easing ?? '',
        startedAt: performance.now(),
      }
    }
    window.__seen = new WeakSet(document.getAnimations())
    window.__clickAt = null
    window.__onClick = () => {
      window.__clickAt = performance.now()
    }
    document.addEventListener('click', window.__onClick, true)
    window.__log = []
    window.__logged = new WeakSet()
    window.__gaps = []
    let last = performance.now()
    const sample = (now) => {
      window.__gaps.push(now - last)
      last = now
      for (const animation of document.getAnimations({ subtree: true })) {
        if (window.__seen.has(animation) || window.__logged.has(animation)) continue
        window.__logged.add(animation)
        window.__log.push(describe(animation))
      }
      window.__raf = requestAnimationFrame(sample)
    }
    window.__raf = requestAnimationFrame(sample)
  })
}

export async function collect(page) {
  return page.evaluate(() => {
    cancelAnimationFrame(window.__raf)
    document.removeEventListener('click', window.__onClick, true)
    const gaps = window.__gaps.slice(1)
    return {
      // Milliseconds from the click to the moment each animation was first seen (one frame of granularity).
      animations: window.__log.map((animation) => ({
        ...animation,
        sinceClick: window.__clickAt === null ? null : Math.round(animation.startedAt - window.__clickAt),
      })),
      frames: {
        count: gaps.length,
        maxGap: gaps.length ? Math.max(...gaps) : 0,
        over24: gaps.filter((gap) => gap > 24).length,
      },
    }
  })
}

/** Runs `act`, waits for animations to play out, and returns what animated. */
export async function observe(page, act, settleMs = 500) {
  await startRecording(page)
  await act()
  await page.waitForTimeout(settleMs)
  return collect(page)
}

export const LAYOUT_PROPERTIES = ['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding', 'margin-top', 'margin-left', 'margin-right', 'margin-bottom', 'padding-top', 'padding-left', 'padding-right', 'padding-bottom', 'marginTop', 'marginLeft', 'marginRight', 'marginBottom', 'paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom']

export const summary = (animation) =>
  `${animation.kind} ${animation.target} [${animation.properties.join(',')}] ${Math.round(animation.duration)}ms ${animation.easing}`
