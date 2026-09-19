import { useCallback, useEffect, useState } from 'react'
import { ROUTE_LABELS, parseRoute, routeToHash } from '../lib/routes'
import type { Route } from '../types'

/** Hash-based routing: works on any static host and gives back/forward for free. */
export function useRoute(): { route: Route; navigate: (route: Route) => void } {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.title = `${ROUTE_LABELS[route]} | FocusList`
  }, [route])

  const navigate = useCallback((next: Route) => {
    window.location.hash = routeToHash(next)
  }, [])

  return { route, navigate }
}
