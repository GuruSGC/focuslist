import type { RefObject } from 'react'
import { PRIORITY_META } from '../lib/priority'
import { PRIORITIES } from '../lib/tasks'
import type { Filters, PriorityFilter, StatusFilter } from '../types'

interface ToolbarProps {
  filters: Filters
  onChange: (filters: Filters) => void
  searchRef: RefObject<HTMLInputElement | null>
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

export function Toolbar({ filters, onChange, searchRef }: ToolbarProps) {
  return (
    <div
      role="search"
      aria-label="Search and filter tasks"
      className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_auto_10rem] lg:items-end"
    >
      <div className="sm:col-span-2 lg:col-span-1">
        <label htmlFor="search" className="field-label max-sm:sr-only">
          Search tasks
        </label>
        <input
          id="search"
          ref={searchRef}
          className="field"
          type="search"
          name="query"
          autoComplete="off"
          placeholder="Search by title…"
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </div>

      <div role="group" aria-labelledby="status-label">
        <span id="status-label" className="field-label max-sm:sr-only">
          Status
        </span>
        <div className="seg w-full">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filters.status === option.value}
              onClick={() => onChange({ ...filters, status: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="priority-filter" className="field-label max-sm:sr-only">
          Priority
        </label>
        <select
          id="priority-filter"
          name="priority"
          className="field"
          value={filters.priority}
          onChange={(event) => onChange({ ...filters, priority: event.target.value as PriorityFilter })}
        >
          <option value="all">All priorities</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_META[priority].label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
