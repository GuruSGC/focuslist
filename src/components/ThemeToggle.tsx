import { Moon, Sun } from '@phosphor-icons/react'
import type { Theme } from '../lib/storage'

interface ThemeToggleProps {
  theme: Theme
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className="btn btn-icon"
      onClick={onToggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      data-testid="theme-toggle"
    >
      {/* Keyed so the new icon mounts and turns in, instead of snapping. */}
      <span key={theme} className="theme-icon grid place-items-center">
        {theme === 'dark' ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}
      </span>
    </button>
  )
}
