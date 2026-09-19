/**
 * Geometry for the FocusList brush stroke: one thick sumi stroke that runs down the
 * left lane, turns right along the bottom lane, then turns up the right lane and ends
 * in a hook. Everything here is pure so it can be unit tested; the component only
 * draws what this module describes.
 */

export interface Point {
  x: number
  y: number
}

export interface JourneyOptions {
  width: number
  height: number
  leftLane: number
  rightLane: number
  bottomLane: number
  thickness: number
}

export interface Journey {
  points: Point[]
  /** Unit normals for each point (pointing to the right of travel). */
  normals: Point[]
  /** Normalised arc length (0..1) at each point. */
  arc: number[]
  /** Width multiplier at each point: landing, press at corners, tail taper. */
  widths: number[]
  /** Indices of the last point of each page segment. */
  endIndex: [number, number, number]
  /** Arc position where each page segment ends. Tasks, Overview, Guide. */
  ends: [number, number, number]
  thickness: number
}

/** Largest amount a bristle may trail the leading edge (fraction of the journey). */
export const LAG_MAX = 0.05

/** Share of a page segment already painted on arrival when the page can scroll. */
export const REST_SHARE = 0.6

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}
const round1 = (value: number) => Math.round(value * 10) / 10

function mulberry32(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const line = (from: Point, to: Point, steps: number): Point[] =>
  Array.from({ length: steps }, (_, i) => {
    const t = i / steps
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
  })

const arc = (center: Point, radius: number, from: number, to: number, steps: number): Point[] =>
  Array.from({ length: steps }, (_, i) => {
    const angle = from + ((to - from) * i) / steps
    return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) }
  })

export function buildJourney(options: JourneyOptions): Journey {
  const { width, height, leftLane, rightLane, bottomLane, thickness } = options
  const radius = Math.min(56, Math.max(thickness * 1.1, Math.min(width, height) * 0.08))
  const xLeft = leftLane / 2
  const xRight = width - rightLane / 2
  const yBottom = height - bottomLane / 2
  // The last leg stops mid-height so the stroke never closes into a frame.
  const yEnd = height * 0.42

  const down = line({ x: xLeft, y: -thickness }, { x: xLeft, y: yBottom - radius }, 40)
  const corner1 = arc({ x: xLeft + radius, y: yBottom - radius }, radius, Math.PI, Math.PI / 2, 12)
  const right = line({ x: xLeft + radius, y: yBottom }, { x: xRight - radius, y: yBottom }, 40)
  const corner2 = arc({ x: xRight - radius, y: yBottom - radius }, radius, Math.PI / 2, 0, 12)
  const up = line({ x: xRight, y: yBottom - radius }, { x: xRight, y: yEnd }, 36)
  const hook = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8
    return { x: xRight - radius * 0.55 * t * t, y: yEnd - radius * 0.5 * t }
  })

  const endIndex: [number, number, number] = [
    down.length,
    down.length + corner1.length + right.length,
    0,
  ]
  const raw = [...down, ...corner1, ...right, ...corner2, ...up, ...hook]
  endIndex[2] = raw.length - 1

  const random = mulberry32(11)
  const phaseA = random() * Math.PI * 2
  const phaseB = random() * Math.PI * 2
  const pressureA = random() * Math.PI * 2
  const pressureB = random() * Math.PI * 2
  const wobble = thickness * 0.05

  const lengths: number[] = [0]
  for (let i = 1; i < raw.length; i += 1) {
    lengths.push(lengths[i - 1]! + Math.hypot(raw[i]!.x - raw[i - 1]!.x, raw[i]!.y - raw[i - 1]!.y))
  }
  const total = lengths.at(-1)!
  const arcs = lengths.map((length) => length / total)

  const normals: Point[] = raw.map((_, i) => {
    const before = raw[Math.max(0, i - 1)]!
    const after = raw[Math.min(raw.length - 1, i + 1)]!
    const dx = after.x - before.x
    const dy = after.y - before.y
    const length = Math.hypot(dx, dy) || 1
    return { x: -dy / length, y: dx / length }
  })

  const points = raw.map((point, i) => {
    const s = arcs[i]!
    const offset = wobble * (Math.sin(s * 38 + phaseA) * 0.6 + Math.sin(s * 91 + phaseB) * 0.4)
    return { x: point.x + normals[i]!.x * offset, y: point.y + normals[i]!.y * offset }
  })

  const cornerOne = arcs[endIndex[0] + 6]!
  const cornerTwo = arcs[endIndex[1] + 6]!
  const widths = arcs.map((s) => {
    const landing = 0.55 + 0.45 * smoothstep(0, 0.04, s)
    const tail = 1 - 0.88 * smoothstep(0.93, 1, s)
    const bulge =
      1 +
      0.16 * Math.exp(-(((s - cornerOne) / 0.025) ** 2)) +
      0.12 * Math.exp(-(((s - cornerTwo) / 0.025) ** 2))
    // Slow pressure changes along the stroke, like a hand easing on and off the brush.
    const pressure = 1 + 0.16 * Math.sin(s * 13 + pressureA) + 0.06 * Math.sin(s * 41 + pressureB)
    return landing * tail * bulge * pressure
  })

  const ends: [number, number, number] = [arcs[endIndex[0]]!, arcs[endIndex[1]]!, 1]

  return { points, normals, arc: arcs, widths, endIndex, ends, thickness }
}

/**
 * Where the leading edge of the stroke should be (0..1 along the journey) for a page.
 * A page that cannot scroll shows its whole segment. A scrollable page arrives
 * partly painted and the rest follows scroll progress.
 */
export function strokeTarget(
  pageIndex: number,
  ends: [number, number, number],
  state: { canScroll: boolean; scroll: number },
): number {
  const segmentEnd = ends[Math.min(Math.max(pageIndex, 0), 2)]!
  if (!state.canScroll) return segmentEnd
  const segmentStart = pageIndex <= 0 ? 0 : ends[Math.min(pageIndex, 2) - 1]!
  const span = segmentEnd - segmentStart
  return segmentStart + span * (REST_SHARE + (1 - REST_SHARE) * clamp01(state.scroll))
}

/** Leading edge of one bristle. Bristles trail the brush, and all catch up at progress 1. */
export function bristleFront(progress: number, lag: number): number {
  return progress - lag * (1 - progress)
}

export function bristleReveal(progress: number, bristle: { a: number; b: number; lag: number }): number {
  return clamp01((bristleFront(progress, bristle.lag) - bristle.a) / (bristle.b - bristle.a))
}

export interface Bristle {
  d: string
  a: number
  b: number
  lag: number
  width: number
  opacity: number
  /** Core bristles form the solid black body; the rest are dry-brush edge streaks. */
  core: boolean
  /** The unbroken middle of the body. It always runs the full length, so it marks where the brush is. */
  center: boolean
}

function pathFor(journey: Journey, from: number, to: number, offset: number, jitter: () => number): string {
  const half = journey.thickness / 2
  const parts: string[] = []
  for (let i = 0; i < journey.points.length; i += 1) {
    const s = journey.arc[i]!
    if (s < from || s > to) continue
    const point = journey.points[i]!
    const normal = journey.normals[i]!
    const distance = offset * half * journey.widths[i]! + jitter()
    const x = round1(point.x + normal.x * distance)
    const y = round1(point.y + normal.y * distance)
    parts.push(`${parts.length === 0 ? 'M' : 'L'}${x} ${y}`)
  }
  return parts.join('')
}

export function buildBristles(journey: Journey, options: { count: number; seed: number }): Bristle[] {
  const random = mulberry32(options.seed)
  const bristles: Bristle[] = []
  const { count } = options
  const spacing = journey.thickness / count
  const jitter = (amount: number) => () => (random() - 0.5) * amount

  for (let k = 0; k < count; k += 1) {
    const offset = -1 + (2 * (k + 0.5)) / count
    const core = Math.abs(offset) < 0.78
    const center = Math.abs(offset) <= 0.3
    const a = core ? 0 : random() * 0.02
    const b = core ? 1 : 0.94 + random() * 0.06
    const width = round1(spacing * 1.9)
    // Off-centre body bristles break once (kasure): thin dry lines where the brush ran out of ink.
    const gapped = core && !center && random() < 0.6
    const gapStart = 0.12 + random() * 0.7
    const gapEnd = Math.min(0.97, gapStart + 0.03 + random() * 0.07)
    const ranges: [number, number][] = gapped
      ? [
          [a, gapStart],
          [gapEnd, b],
        ]
      : [[a, b]]
    for (const [from, to] of ranges) {
      const path = pathFor(journey, from, to, offset, jitter(spacing * 0.4))
      if (path.length === 0) continue
      bristles.push({
        d: path,
        a: from,
        b: to,
        lag: core ? random() * LAG_MAX * 0.4 : LAG_MAX * (0.4 + random() * 0.6),
        width,
        opacity: core ? 1 : 0.8 + random() * 0.18,
        core,
        center,
      })
    }
  }

  const streaks = Math.max(4, Math.round(count / 3))
  for (let k = 0; k < streaks; k += 1) {
    const side = k % 2 === 0 ? -1 : 1
    const offset = side * (1.02 + random() * 0.28)
    const start = random() * 0.5
    const span = 0.25 + random() * 0.5
    const a = start
    const b = Math.min(1, start + span)
    const path = pathFor(journey, a, b, offset, jitter(spacing * 0.5))
    if (path.length === 0) continue
    bristles.push({
      d: path,
      a,
      b,
      lag: LAG_MAX * (0.5 + random() * 0.5),
      width: round1(Math.max(1, spacing * (0.5 + random() * 0.6))),
      opacity: 0.45 + random() * 0.4,
      core: false,
      center: false,
    })
  }

  return bristles
}
