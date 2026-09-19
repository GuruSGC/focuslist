/** Cubic bezier easing (same maths as CSS cubic-bezier), returned as a function of time 0..1. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const sample = (a: number, b: number, t: number) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3
  const slope = (a: number, b: number, t: number) =>
    3 * a * (1 - t) ** 2 + 6 * (b - a) * (1 - t) * t + 3 * (1 - b) * t ** 2

  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i += 1) {
      const error = sample(x1, x2, t) - x
      const derivative = slope(x1, x2, t)
      if (Math.abs(error) < 1e-6 || derivative === 0) break
      t -= error / derivative
    }
    // Fall back to bisection when Newton's method leaves the valid range.
    if (t < 0 || t > 1) {
      let low = 0
      let high = 1
      t = x
      for (let i = 0; i < 24; i += 1) {
        const value = sample(x1, x2, t)
        if (Math.abs(value - x) < 1e-6) break
        if (value < x) low = t
        else high = t
        t = (low + high) / 2
      }
    }
    return sample(y1, y2, t)
  }
}

/** Strong ease-out used for all UI motion in FocusList. */
export const easeOut = cubicBezier(0.23, 1, 0.32, 1)

export interface Tween {
  from: number
  to: number
  duration: number
  onUpdate: (value: number) => void
  onComplete?: () => void
}

/** Runs a requestAnimationFrame tween and returns a function that cancels it. */
export function runTween({ from, to, duration, onUpdate, onComplete }: Tween): () => void {
  let frame = 0
  let start = 0
  const step = (now: number) => {
    if (start === 0) start = now
    const t = Math.min(1, (now - start) / duration)
    onUpdate(from + (to - from) * easeOut(t))
    if (t < 1) frame = requestAnimationFrame(step)
    else onComplete?.()
  }
  frame = requestAnimationFrame(step)
  return () => cancelAnimationFrame(frame)
}
