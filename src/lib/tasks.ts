import type { Filters, Priority, Stats, Task } from '../types'

export const MAX_TITLE_LENGTH = 120

export const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low']

export type TitleResult = { ok: true; title: string } | { ok: false; error: string }

export function validateTitle(raw: string): TitleResult {
  const title = raw.trim()
  if (title.length === 0) return { ok: false, error: 'Enter a task title.' }
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `Keep the title under ${MAX_TITLE_LENGTH} characters.` }
  }
  return { ok: true, title }
}

export type TaskAction =
  | { type: 'add'; id: string; title: string; priority: Priority; now: number }
  | { type: 'toggle'; id: string; now: number }
  | { type: 'edit'; id: string; title: string; priority: Priority; now: number }
  | { type: 'remove'; id: string }
  | { type: 'restore'; task: Task; index: number }
  | { type: 'replace'; tasks: Task[] }

export function taskReducer(state: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case 'add':
      return [
        {
          id: action.id,
          title: action.title,
          priority: action.priority,
          completed: false,
          createdAt: action.now,
          updatedAt: action.now,
        },
        ...state,
      ]
    case 'toggle':
      return state.map((task) =>
        task.id === action.id
          ? { ...task, completed: !task.completed, updatedAt: action.now }
          : task,
      )
    case 'edit':
      return state.map((task) =>
        task.id === action.id
          ? { ...task, title: action.title, priority: action.priority, updatedAt: action.now }
          : task,
      )
    case 'remove':
      return state.filter((task) => task.id !== action.id)
    case 'restore': {
      if (state.some((task) => task.id === action.task.id)) return state
      const next = [...state]
      next.splice(Math.min(Math.max(action.index, 0), next.length), 0, action.task)
      return next
    }
    case 'replace':
      return action.tasks
  }
}

export function filterTasks(tasks: Task[], filters: Filters): Task[] {
  const query = filters.query.trim().toLowerCase()
  return tasks.filter((task) => {
    if (query && !task.title.toLowerCase().includes(query)) return false
    if (filters.status === 'active' && task.completed) return false
    if (filters.status === 'completed' && !task.completed) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    return true
  })
}

export function computeStats(tasks: Task[]): Stats {
  const byPriority: Stats['byPriority'] = {
    high: { total: 0, pending: 0 },
    medium: { total: 0, pending: 0 },
    low: { total: 0, pending: 0 },
  }
  let completed = 0
  for (const task of tasks) {
    const bucket = byPriority[task.priority]
    bucket.total += 1
    if (task.completed) completed += 1
    else bucket.pending += 1
  }
  const total = tasks.length
  return {
    total,
    completed,
    pending: total - completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    byPriority,
  }
}

export function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
