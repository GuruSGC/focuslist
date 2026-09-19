/**
 * FocusList motion helpers. Every duration comes from the CSS motion tokens in src/index.css
 * (--dur-*), so one variable, --motion-scale, controls the pace of everything. All effects are
 * Web Animations on transform and opacity, so they stay on the compositor and can be interrupted.
 *
 * Personality: a printmaker's studio. Ink blooms under a press, a seal stamps down, a row
 * takes a brief wash of colour, and a deleted row lifts away.
 */

export type DurationToken = 'press' | 'hover' | 'state' | 'enter' | 'exit' | 'page'

export interface Point {
  x: number
  y: number
}

const root = () => document.documentElement

/** Parses a resolved CSS time such as "240ms" or "0.24s" into milliseconds. */
export function parseTime(value: string): number {
  const text = value.trim()
  const number = Number.parseFloat(text)
  if (!Number.isFinite(number)) return 0
  return text.endsWith('ms') ? number : text.endsWith('s') ? number * 1000 : number
}

/** Milliseconds for a motion token, read from CSS at call time so --motion-scale is honoured. */
export function duration(token: DurationToken): number {
  return parseTime(getComputedStyle(root()).getPropertyValue(`--dur-${token}`))
}

/**
 * A curve from the CSS tokens. `out` is for things entering or leaving; `in-out` is for
 * elements that are already on screen and move (the list reflowing).
 */
export function ease(kind: 'out' | 'in-out' = 'out'): string {
  return getComputedStyle(root()).getPropertyValue(`--ease-${kind}`).trim() || (kind === 'out' ? 'ease-out' : 'ease-in-out')
}

export function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The transform a row needs at the start of a reflow animation so it appears not to have moved.
 * `before` is its layout position in the previous frame, `translate` the transform it was still
 * carrying from an interrupted animation, `after` its new layout position.
 */
export function flipDelta(before: Point, translate: Point, after: Point): Point {
  return { x: before.x + translate.x - after.x, y: before.y + translate.y - after.y }
}

/** True for a movement large enough to be worth animating. */
export const isMovement = (delta: Point) => Math.abs(delta.x) > 0.5 || Math.abs(delta.y) > 0.5

function play(element: Element, keyframes: Keyframe[], token: DurationToken, options: KeyframeAnimationOptions = {}) {
  const ms = duration(token)
  if (ms <= 0) return null
  return element.animate(keyframes, { duration: ms, easing: ease(), ...options })
}

/**
 * The click echo: a wash of ink blooms from the point of contact and fades. Pointer clicks only:
 * keyboard activations do not animate. Under reduced motion it is a fade with no travel.
 */
export function inkBloom(target: HTMLElement, clientX: number, clientY: number) {
  if (duration('enter') <= 0) return
  const rect = target.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top
  const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y))
  const ink = document.createElement('span')
  ink.className = 'ink'
  ink.setAttribute('aria-hidden', 'true')
  ink.style.left = `${x - radius}px`
  ink.style.top = `${y - radius}px`
  ink.style.width = `${radius * 2}px`
  ink.style.height = `${radius * 2}px`
  target.append(ink)
  const frames = reducedMotion()
    ? [{ opacity: 0.18 }, { opacity: 0 }]
    : [
        { opacity: 0.22, transform: 'scale(0.2)' },
        { opacity: 0, transform: 'scale(1)' },
      ]
  const animation = play(ink, frames, 'enter')
  if (animation) animation.onfinish = () => ink.remove()
  else ink.remove()
}

/** A brief wash of the accent colour across a row that has just been added or changed. */
export function washFlash(row: HTMLElement) {
  if (duration('state') <= 0) return
  const wash = document.createElement('span')
  wash.className = 'wash'
  wash.setAttribute('aria-hidden', 'true')
  row.prepend(wash)
  const animation = play(wash, [{ opacity: 0.16 }, { opacity: 0 }], 'enter')
  if (animation) animation.onfinish = () => wash.remove()
  else wash.remove()
}

/** A short sideways shake for a rejected input. Skipped under reduced motion (the error text and border still show). */
export function shake(element: HTMLElement) {
  if (reducedMotion()) return
  play(
    element,
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-9px)' },
      { transform: 'translateX(7px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(3px)' },
      { transform: 'translateX(0)' },
    ],
    'enter',
  )
}

/**
 * The exit of a deleted element. The real element is removed from the page at once (state is
 * instant); this leaves a non-interactive, hidden-from-assistive-tech copy that lifts away.
 */
export function ghostOut(source: HTMLElement) {
  if (duration('exit') <= 0) return
  const rect = source.getBoundingClientRect()
  const ghost = source.cloneNode(true) as HTMLElement
  ghost.removeAttribute('id')
  ghost.removeAttribute('data-testid')
  ghost.removeAttribute('data-flip-id')
  for (const node of ghost.querySelectorAll('[id], [data-testid], [data-flip-id], .ink, .wash')) {
    if (node.matches('.ink, .wash')) node.remove()
    else {
      node.removeAttribute('id')
      node.removeAttribute('data-testid')
      node.removeAttribute('data-flip-id')
    }
  }
  // Cloning does not copy live form state; carry the checked state over so the copy looks the same.
  const originals = source.querySelectorAll('input')
  ghost.querySelectorAll('input').forEach((input, index) => {
    const original = originals[index]
    if (original) input.checked = original.checked
    input.tabIndex = -1
  })
  ghost.classList.add('ghost')
  ghost.setAttribute('aria-hidden', 'true')
  ghost.setAttribute('inert', '')
  ghost.dataset.ghost = 'true'
  Object.assign(ghost.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  })
  document.body.append(ghost)
  const frames = reducedMotion()
    ? [{ opacity: 1 }, { opacity: 0 }]
    : [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateX(18px) scale(0.98)' },
      ]
  const animation = play(ghost, frames, 'exit', { fill: 'forwards' })
  if (animation) animation.onfinish = () => ghost.remove()
  else ghost.remove()
}

/** Cross-fades colours while the theme changes, then stops so ordinary interactions are not affected. */
export function fadeThemeSwitch() {
  const ms = duration('enter')
  if (ms <= 0) return
  root().classList.add('theme-fading')
  window.setTimeout(() => root().classList.remove('theme-fading'), ms + 60)
}

const PRESS_TARGETS = '.btn, .seg > button, .seg > label, .nav-link, .check'

/**
 * Gives every button-like control the ink bloom, from one delegated listener. The click on a
 * radio input that a label forwards is skipped, because the label click already bloomed.
 */
export function installPressFeedback(): () => void {
  const onClick = (event: MouseEvent) => {
    const source = event.target
    if (!(source instanceof Element)) return
    const target = source.closest<HTMLElement>(PRESS_TARGETS)
    if (!target || target.matches(':disabled')) return
    if (source instanceof HTMLInputElement && source.type === 'radio') return
    // detail is 0 when the click came from the keyboard (Enter or Space), which should not animate.
    if (event.detail === 0) return
    inkBloom(target, event.clientX, event.clientY)
  }
  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}

let flipPausedUntil = 0

/** Stops list reflow animation for a moment, used while typing in search where results should update instantly. */
export function pauseFlip(ms: number) {
  flipPausedUntil = performance.now() + ms
}

export const flipPaused = () => performance.now() < flipPausedUntil
