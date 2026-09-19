import { useCallback, useState } from 'react'
import { fadeThemeSwitch } from '../lib/motion'
import { saveTheme, type Theme } from '../lib/storage'

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

/** The inline script in index.html sets the initial theme before paint; this keeps React in sync. */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  const toggle = useCallback(() => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
    fadeThemeSwitch()
    document.documentElement.dataset.theme = next
    saveTheme(window.localStorage, next)
    setTheme(next)
  }, [])

  return { theme, toggle }
}
