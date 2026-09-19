import { describe, expect, it } from 'vitest'
import {
  LAG_MAX,
  bristleFront,
  bristleReveal,
  buildBristles,
  buildJourney,
  strokeTarget,
  type JourneyOptions,
} from '../src/lib/brush'

const desktop: JourneyOptions = {
  width: 1440,
  height: 900,
  leftLane: 88,
  rightLane: 88,
  bottomLane: 88,
  thickness: 52,
}

describe('buildJourney', () => {
  const journey = buildJourney(desktop)

  it('has strictly increasing arc positions from 0 to 1', () => {
    expect(journey.arc[0]).toBe(0)
    expect(journey.arc.at(-1)).toBeCloseTo(1, 6)
    for (let i = 1; i < journey.arc.length; i += 1) {
      expect(journey.arc[i]!).toBeGreaterThan(journey.arc[i - 1]!)
    }
  })

  it('starts above the viewport and runs down the left lane', () => {
    const first = journey.points[0]!
    expect(first.y).toBeLessThan(0)
    const endIndex = journey.endIndex[0]
    const laneX = desktop.leftLane / 2
    for (let i = 0; i <= endIndex; i += 1) {
      expect(Math.abs(journey.points[i]!.x - laneX)).toBeLessThan(6)
    }
    expect(journey.points[endIndex]!.y).toBeGreaterThan(desktop.height * 0.6)
  })

  it('turns right along the bottom lane', () => {
    const [i0, i1] = journey.endIndex
    const start = journey.points[i0]!
    const end = journey.points[i1]!
    expect(end.x).toBeGreaterThan(start.x + desktop.width * 0.5)
    const laneY = desktop.height - desktop.bottomLane / 2
    for (let i = i0 + 14; i <= i1; i += 1) {
      expect(Math.abs(journey.points[i]!.y - laneY)).toBeLessThan(6)
    }
  })

  it('turns up the right lane and ends with a hook', () => {
    const last = journey.points.at(-1)!
    const beforeHook = journey.points[journey.endIndex[1] + 30]!
    expect(last.y).toBeLessThan(beforeHook.y)
    expect(last.x).toBeLessThan(desktop.width - desktop.rightLane / 2 + 2)
  })

  it('reports page ends in order and inside (0, 1]', () => {
    const [a, b, c] = journey.ends
    expect(a).toBeGreaterThan(0)
    expect(b).toBeGreaterThan(a)
    expect(c).toBe(1)
  })

  it('tapers at the tail and presses at the start', () => {
    expect(journey.widths.at(-1)!).toBeLessThan(0.3)
    expect(journey.widths[0]!).toBeLessThan(journey.widths[20]!)
    expect(Math.max(...journey.widths)).toBeGreaterThan(1)
  })

  it('is deterministic for the same options', () => {
    expect(buildJourney(desktop).points).toEqual(journey.points)
  })

  it('produces finite coordinates on a small phone viewport', () => {
    const phone = buildJourney({
      width: 375,
      height: 667,
      leftLane: 28,
      rightLane: 28,
      bottomLane: 44,
      thickness: 20,
    })
    for (const point of phone.points) {
      expect(Number.isFinite(point.x)).toBe(true)
      expect(Number.isFinite(point.y)).toBe(true)
    }
  })
})

describe('strokeTarget', () => {
  const ends: [number, number, number] = [0.3, 0.6, 1]

  it('goes to the end of the page segment when the page cannot scroll', () => {
    expect(strokeTarget(0, ends, { canScroll: false, scroll: 0 })).toBeCloseTo(0.3)
    expect(strokeTarget(1, ends, { canScroll: false, scroll: 0 })).toBeCloseTo(0.6)
    expect(strokeTarget(2, ends, { canScroll: false, scroll: 0 })).toBe(1)
  })

  it('advances monotonically with scroll on a scrollable page and ends at the segment end', () => {
    const at = (scroll: number) => strokeTarget(1, ends, { canScroll: true, scroll })
    expect(at(0)).toBeGreaterThan(0.3)
    expect(at(0)).toBeLessThan(0.6)
    expect(at(0.5)).toBeGreaterThan(at(0))
    expect(at(1)).toBeCloseTo(0.6)
  })

  it('clamps scroll progress outside 0..1', () => {
    expect(strokeTarget(0, ends, { canScroll: true, scroll: -2 })).toBe(
      strokeTarget(0, ends, { canScroll: true, scroll: 0 }),
    )
    expect(strokeTarget(0, ends, { canScroll: true, scroll: 4 })).toBeCloseTo(0.3)
  })
})

describe('bristle reveal', () => {
  it('trails the leading edge but always completes at full progress', () => {
    expect(bristleFront(0.5, 0)).toBe(0.5)
    expect(bristleFront(0.5, LAG_MAX)).toBeLessThan(0.5)
    expect(bristleFront(1, LAG_MAX)).toBe(1)
  })

  it('reveals nothing at 0 and everything at 1', () => {
    const bristle = { a: 0.1, b: 0.9, lag: LAG_MAX }
    expect(bristleReveal(0, bristle)).toBe(0)
    expect(bristleReveal(1, bristle)).toBe(1)
  })

  it('is monotonic in progress', () => {
    const bristle = { a: 0, b: 1, lag: 0.02 }
    let previous = -1
    for (let p = 0; p <= 1; p += 0.05) {
      const value = bristleReveal(p, bristle)
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })
})

describe('buildBristles', () => {
  const journey = buildJourney(desktop)
  const bristles = buildBristles(journey, { count: 16, seed: 7 })

  it('builds solid core bristles plus ragged edge bristles', () => {
    expect(bristles.length).toBeGreaterThan(16)
    expect(bristles.some((b) => b.core)).toBe(true)
    expect(bristles.some((b) => !b.core)).toBe(true)
  })

  it('gives every bristle a valid range and a drawable path', () => {
    for (const bristle of bristles) {
      expect(bristle.a).toBeGreaterThanOrEqual(0)
      expect(bristle.b).toBeLessThanOrEqual(1)
      expect(bristle.b).toBeGreaterThan(bristle.a)
      expect(bristle.d.startsWith('M')).toBe(true)
      expect(bristle.d).not.toContain('NaN')
    }
  })

  it('keeps an unbroken centre and breaks some body bristles for a dry-brush look', () => {
    const centres = bristles.filter((b) => b.center)
    expect(centres.length).toBeGreaterThan(0)
    for (const bristle of centres) {
      expect(bristle.a).toBe(0)
      expect(bristle.b).toBe(1)
    }
    const body = bristles.filter((b) => b.core && !b.center)
    expect(body.some((b) => b.a > 0 || b.b < 1)).toBe(true)
  })

  it('is deterministic for a given seed', () => {
    expect(buildBristles(journey, { count: 16, seed: 7 })).toEqual(bristles)
    expect(buildBristles(journey, { count: 16, seed: 8 })).not.toEqual(bristles)
  })
})
