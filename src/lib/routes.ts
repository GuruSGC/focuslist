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

