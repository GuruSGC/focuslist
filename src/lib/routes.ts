import type { Route } from '../types'

export const ROUTES: readonly Route[] = ['tasks', 'overview', 'guide']

export const ROUTE_LABELS: Record<Route, string> = {
  tasks: 'Tasks',
  overview: 'Overview',
  guide: 'Guide',
}

export function parseRoute(hash: string): Route {
  const name = hash.replace(/^#\/?/, '')
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'tasks'
}

export function routeToHash(route: Route): string {
  return `#/${route}`
}

/** Position in the brush stroke journey: Tasks 0, Overview 1, Guide 2. */
export function routeIndex(route: Route): number {
  return ROUTES.indexOf(route)
}
