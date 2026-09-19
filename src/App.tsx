import { useEffect, useRef, useState } from 'react'
import { Backdrop } from './components/Backdrop'
import { BrushJourney } from './components/BrushJourney'
import { Header } from './components/Header'
import { UndoToast } from './components/UndoToast'
import { useRoute } from './hooks/useRoute'
import { useTasks } from './hooks/useTasks'
import { useTheme } from './hooks/useTheme'
import { GuidePage } from './pages/GuidePage'
import { OverviewPage } from './pages/OverviewPage'
import { DEFAULT_FILTERS, TasksPage } from './pages/TasksPage'
import type { Filters } from './types'

type PendingFocus = 'new' | 'search' | null

export default function App() {
  const { route, navigate } = useRoute()
  const { theme, toggle } = useTheme()
  const api = useTasks()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const newTaskRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const pendingFocus = useRef<PendingFocus>(null)
  const firstRender = useRef(true)

  // After a route change, focus the field a shortcut asked for, otherwise the page heading.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (route === 'tasks' && pendingFocus.current) {
      const target = pendingFocus.current === 'new' ? newTaskRef.current : searchRef.current
      pendingFocus.current = null
      target?.focus()
      return
    }
    document.getElementById('page-title')?.focus()
  }, [route])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      const wanted: PendingFocus = event.key === 'n' ? 'new' : event.key === '/' ? 'search' : null
      if (!wanted) return
      event.preventDefault()
      if (route === 'tasks') {
        ;(wanted === 'new' ? newTaskRef.current : searchRef.current)?.focus()
      } else {
        pendingFocus.current = wanted
        navigate('tasks')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [route, navigate])

  return (
    <>
      <Backdrop />
      <BrushJourney route={route} />
      <div className="shell">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-sumi focus:px-4 focus:py-3 focus:text-paper"
          onClick={(event) => {
            event.preventDefault()
            document.getElementById('page-title')?.focus()
          }}
        >
          Skip to content
        </a>
        <Header route={route} theme={theme} onToggleTheme={toggle} />
        <main id="main" className="w-full max-w-[46rem] flex-1 pb-6" data-route={route}>
          {route === 'tasks' && (
            <TasksPage api={api} filters={filters} onFiltersChange={setFilters} newTaskRef={newTaskRef} searchRef={searchRef} />
          )}
          {route === 'overview' && <OverviewPage tasks={api.tasks} />}
          {route === 'guide' && <GuidePage />}
        </main>
        <UndoToast deleted={api.deleted} onUndo={api.undoRemove} />
      </div>
    </>
  )
}
