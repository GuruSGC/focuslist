import { useMemo, type RefObject } from 'react'
import { Stats } from '../components/Stats'
import { TaskForm } from '../components/TaskForm'
import { TaskList } from '../components/TaskList'
import { Toolbar } from '../components/Toolbar'
import type { TasksApi } from '../hooks/useTasks'
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

  return (
    <div className="page grid gap-y-3 pt-2 sm:gap-y-4 sm:pt-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 id="page-title" tabIndex={-1} className="text-3xl sm:text-4xl">
          Tasks
        </h1>
        <Stats stats={stats} className="max-sm:w-full" />
      </div>
      <TaskForm onAdd={api.addTask} inputRef={newTaskRef} />
      <Toolbar filters={filters} onChange={onFiltersChange} searchRef={searchRef} />
      <TaskList
        tasks={visible}
        totalCount={api.tasks.length}
        onToggle={api.toggleTask}
        onEdit={api.editTask}
        onDelete={api.removeTask}
        onClearFilters={() => onFiltersChange(DEFAULT_FILTERS)}
      />
    </div>
  )
}
