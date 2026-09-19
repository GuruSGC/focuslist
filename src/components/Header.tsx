import { ROUTES, ROUTE_LABELS, routeToHash } from '../lib/routes'
import type { Theme } from '../lib/storage'
import type { Route } from '../types'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  route: Route
  theme: Theme
  onToggleTheme: () => void
}

export function Header({ route, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 pt-3 sm:pt-5">
      <a href={routeToHash('tasks')} className="wordmark flex items-baseline gap-2 py-2">
        <span translate="no">FocusList</span>
        <span className="kanji-accent text-xl" aria-hidden="true" lang="ja">
          集中
        </span>
      </a>

      <nav aria-label="Primary" className="order-3 w-full sm:order-none sm:w-auto">
        <ul className="flex">
          {ROUTES.map((name) => (
            <li key={name}>
              <a
                href={routeToHash(name)}
                className="nav-link"
                aria-current={route === name ? 'page' : undefined}
                data-testid={`nav-${name}`}
              >
                {ROUTE_LABELS[name]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  )
}
