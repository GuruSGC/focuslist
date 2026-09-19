import { describe, expect, it } from 'vitest'
import { cubicBezier, easeOut } from '../src/lib/ease'

describe('cubicBezier', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeOut(0)).toBe(0)
    expect(easeOut(1)).toBe(1)
  })

  it('is monotonic for the strong ease-out curve', () => {
    let previous = -1
    for (let t = 0; t <= 1; t += 0.02) {
      const value = easeOut(t)
      expect(value).toBeGreaterThanOrEqual(previous - 1e-9)
      previous = value
    }
  })

  it('moves faster at the start than a linear curve (ease-out)', () => {
    expect(easeOut(0.2)).toBeGreaterThan(0.2)
  })

  it('reduces to linear for the identity control points', () => {
    const linear = cubicBezier(1 / 3, 1 / 3, 2 / 3, 2 / 3)
    expect(linear(0.5)).toBeCloseTo(0.5, 3)
  })
})
