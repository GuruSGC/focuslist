import { describe, expect, it } from 'vitest'
import { flipDelta, isMovement, parseTime } from '../src/lib/motion'

describe('parseTime', () => {
  it('reads milliseconds and seconds', () => {
    expect(parseTime('240ms')).toBe(240)
    expect(parseTime('0.28s')).toBeCloseTo(280)
    expect(parseTime(' 120ms ')).toBe(120)
  })

  it('treats empty or invalid values as zero', () => {
    expect(parseTime('')).toBe(0)
    expect(parseTime('auto')).toBe(0)
  })
})

describe('flipDelta', () => {
  it('starts a row where it used to be', () => {
    // The row moved up by 72px: it should start 72px lower and animate back to zero.
    expect(flipDelta({ x: 0, y: 200 }, { x: 0, y: 0 }, { x: 0, y: 128 })).toEqual({ x: 0, y: 72 })
  })

  it('continues smoothly from an interrupted animation', () => {
    // It was 20px into an earlier move when the list changed again.
    expect(flipDelta({ x: 0, y: 100 }, { x: 0, y: 20 }, { x: 0, y: 100 })).toEqual({ x: 0, y: 20 })
  })

  it('is zero when nothing moved', () => {
    const delta = flipDelta({ x: 4, y: 4 }, { x: 0, y: 0 }, { x: 4, y: 4 })
    expect(isMovement(delta)).toBe(false)
  })
})

describe('isMovement', () => {
  it('ignores sub-pixel changes', () => {
    expect(isMovement({ x: 0.3, y: -0.4 })).toBe(false)
    expect(isMovement({ x: 0, y: 1 })).toBe(true)
  })
})
