import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { scroll } from 'motion'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useViewport } from '../hooks/useViewport'
import { bristleReveal, buildBristles, buildJourney, strokeTarget } from '../lib/brush'
import { runTween } from '../lib/ease'
import { routeIndex } from '../lib/routes'
import type { Route } from '../types'

const PAGE_TWEEN_MS = 650
const RESCROLL_TWEEN_MS = 320

/** Lane sizes and stroke thickness come from CSS custom properties so layout and stroke agree. */
function readMetrics() {
  const style = getComputedStyle(document.documentElement)
  const px = (name: string) => Number.parseFloat(style.getPropertyValue(name)) || 0
  return {
    leftLane: px('--lane-l'),
    rightLane: px('--lane-r'),
    bottomLane: px('--lane-b'),
    thickness: px('--stroke'),
  }
}

const pageCanScroll = () => document.documentElement.scrollHeight > window.innerHeight + 2

/**
 * One thick black brush stroke fixed behind the app. It starts downward on the Tasks page,
 * turns right on Overview and turns up with a hook on Guide. On a page that scrolls, the
 * stroke also follows scroll. Decorative only: hidden from assistive tech, never intercepts input.
 */
export function BrushJourney({ route }: { route: Route }) {
  const viewport = useViewport()
  const reduced = useReducedMotion()

  const journey = useMemo(
    () => buildJourney({ width: viewport.width, height: viewport.height, ...readMetrics() }),
    [viewport],
  )
  const bristles = useMemo(
    () => buildBristles(journey, { count: journey.thickness > 30 ? 18 : 12, seed: 7 }),
    [journey],
  )

  const svgRef = useRef<SVGSVGElement>(null)
  const pathRefs = useRef<(SVGPathElement | null)[]>([])
  const progress = useRef(0)
  const scrolled = useRef(0)
  const cancelTween = useRef<(() => void) | null>(null)
  const tweening = useRef(false)
  const latest = useRef({ journey, route, reduced, bristles })
  // Keep the newest values readable from long-lived callbacks without re-subscribing them.
  useLayoutEffect(() => {
    latest.current = { journey, route, reduced, bristles }
  })

  const draw = useCallback((value: number) => {
    progress.current = value
    const { bristles: current } = latest.current
    current.forEach((bristle, index) => {
      const element = pathRefs.current[index]
      if (!element) return
      const reveal = bristleReveal(value, bristle)
      element.style.strokeDashoffset = String(1 - reveal)
      element.style.visibility = reveal <= 0.001 ? 'hidden' : 'visible'
    })
    svgRef.current?.setAttribute('data-progress', value.toFixed(4))
  }, [])

  const targetNow = useCallback(() => {
    const { journey: current, route: page } = latest.current
    return strokeTarget(routeIndex(page), current.ends, { canScroll: pageCanScroll(), scroll: scrolled.current })
  }, [])

  /** Moves the leading edge to `to`, easing unless motion is reduced or `duration` is 0. */
  const moveTo = useCallback(
    (to: number, duration: number) => {
      cancelTween.current?.()
      tweening.current = false
      if (latest.current.reduced || duration === 0 || Math.abs(to - progress.current) < 0.0005) {
        draw(to)
        return
      }
      tweening.current = true
      cancelTween.current = runTween({
        from: progress.current,
        to,
        duration,
        onUpdate: draw,
        onComplete: () => {
          tweening.current = false
          draw(targetNow())
        },
      })
    },
    [draw, targetNow],
  )

  // Repaint at the current progress whenever the stroke is rebuilt (resize).
  useLayoutEffect(() => {
    draw(progress.current)
  }, [bristles, draw])

  // Navigating to another page moves the brush to that page's segment. The first load paints in from the top.
  useEffect(() => {
    scrolled.current = 0
    window.scrollTo(0, 0)
    moveTo(targetNow(), PAGE_TWEEN_MS)
  }, [route, moveTo, targetNow])

  // Scroll-linked painting on pages taller than the viewport.
  useEffect(() => {
    const stop = scroll((value: number) => {
      scrolled.current = Number.isFinite(value) ? value : 0
      if (!tweening.current) draw(targetNow())
    })
    return stop
  }, [draw, targetNow])

  // Content growing past the viewport (or shrinking back) eases the stroke to its new resting point.
  useEffect(() => {
    let scrollable = pageCanScroll()
    const observer = new ResizeObserver(() => {
      const next = pageCanScroll()
      if (next === scrollable) return
      scrollable = next
      moveTo(targetNow(), RESCROLL_TWEEN_MS)
    })
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [moveTo, targetNow])

  useEffect(() => () => cancelTween.current?.(), [])

  return (
    <svg
      ref={svgRef}
      className="layer-fixed z-[1]"
      width={viewport.width}
      height={viewport.height}
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      aria-hidden="true"
      focusable="false"
      data-testid="brush-stroke"
      data-page={route}
      data-progress="0"
    >
      <g fill="none" stroke="var(--brush)" strokeLinecap="round" strokeLinejoin="round">
        {bristles.map((bristle, index) => (
          <path
            key={index}
            ref={(element) => {
              pathRefs.current[index] = element
            }}
            d={bristle.d}
            pathLength={1}
            strokeWidth={bristle.width}
            strokeOpacity={bristle.opacity}
            strokeDasharray="1 1"
            strokeDashoffset={1}
            visibility="hidden"
            data-core={bristle.core}
            data-center={bristle.center}
          />
        ))}
      </g>
    </svg>
  )
}
