import { useMemo, type RefObject } from 'react'
import { Stats } from '../components/Stats'
import { TaskForm } from '../components/TaskForm'
import { TaskList } from '../components/TaskList'
import { Toolbar } from '../components/Toolbar'
import type { TasksApi } from '../hooks/useTasks'
import { ghostOut } from '../lib/motion'
import { computeStats, filterTasks } from '../lib/tasks'
import type { Filters } from '../types'

interface TasksPageProps {
  api: TasksApi
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  newTaskRef: RefObject<HTMLInputElement | null>
  searchRef: RefObject<HTMLInputElement | null>
}

export const DEFAULT_FILTERS: Filters = { query: '', status: 'all', priority: 'all' }

export function TasksPage({ api, filters, onFiltersChange, newTaskRef, searchRef }: TasksPageProps) {
  const visible = useMemo(() => filterTasks(api.tasks, filters), [api.tasks, filters])
  const stats = useMemo(() => computeStats(api.tasks), [api.tasks])

  /** Rows that are about to leave the list get an exit, instead of vanishing. */
  const exitRows = (leaving: (id: string) => boolean) => {
    document.querySelectorAll<HTMLElement>('[data-testid="task-item"]').forEach((row) => {
      if (row.dataset.flipId && leaving(row.dataset.flipId)) ghostOut(row)
    })
  }

  const changeFilters = (next: Filters, options?: { typing: boolean }) => {
    // Typing in search is high-frequency, so results update at once. Buttons and the select animate.
    if (!options?.typing) {
      const stays = new Set(filterTasks(api.tasks, next).map((task) => task.id))
      exitRows((id) => !stays.has(id))
    }
    onFiltersChange(next)
  }

  /** Completing or reopening a task while a status filter is on removes it from the view. */
  const toggleTask = (id: string) => {
    if (filters.status !== 'all') exitRows((rowId) => rowId === id)
    api.toggleTask(id)
  }

  return (
    <div className="page grid gap-y-3 pt-2 sm:gap-y-4 sm:pt-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 id="page-title" tabIndex={-1} className="text-3xl sm:text-4xl">
          Tasks
        </h1>
        <Stats stats={stats} className="max-sm:w-full" />
      </div>
      <TaskForm onAdd={api.addTask} inputRef={newTaskRef} />
      <Toolbar filters={filters} onChange={changeFilters} searchRef={searchRef} />
      <TaskList
        tasks={visible}
        totalCount={api.tasks.length}
        onToggle={toggleTask}
        onEdit={api.editTask}
        onDelete={api.removeTask}
        onClearFilters={() => changeFilters(DEFAULT_FILTERS)}
      />
    </div>
  )
}
