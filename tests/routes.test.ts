import { describe, expect, it } from 'vitest'
import { ROUTES, parseRoute, routeIndex, routeToHash } from '../src/lib/routes'

describe('routes', () => {
  it('parses known hash routes', () => {
    expect(parseRoute('#/tasks')).toBe('tasks')
    expect(parseRoute('#/overview')).toBe('overview')
    expect(parseRoute('#/guide')).toBe('guide')
  })

  it('falls back to tasks for empty or unknown hashes', () => {
    expect(parseRoute('')).toBe('tasks')
    expect(parseRoute('#')).toBe('tasks')
    expect(parseRoute('#/nope')).toBe('tasks')
  })

  it('round-trips route and hash', () => {
    for (const route of ROUTES) expect(parseRoute(routeToHash(route))).toBe(route)
  })

  it('orders routes for the brush stroke journey', () => {
    expect(ROUTES.map(routeIndex)).toEqual([0, 1, 2])
  })
})
