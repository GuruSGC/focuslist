import type { Task } from '../types'

export const STORAGE_KEY = 'focuslist:v1'
export const THEME_KEY = 'focuslist:theme'

export type Theme = 'light' | 'dark'

/** The slice of the Web Storage API we depend on, so tests can pass a fake. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>

const PRIORITIES = new Set(['high', 'medium', 'low'])

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.priority === 'string' &&
    PRIORITIES.has(v.priority) &&
    typeof v.completed === 'boolean' &&
    typeof v.createdAt === 'number' &&
    typeof v.updatedAt === 'number'
  )
}

/** Parses stored JSON, keeping only well-formed tasks. Never throws. */
export function parseTasks(raw: string | null): Task[] {
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? data.filter(isTask) : []
  } catch {
    return []
  }
}

export function loadTasks(storage: KeyValueStore): Task[] {
  try {
    return parseTasks(storage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

export function saveTasks(storage: KeyValueStore, tasks: Task[]): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    // Storage can be full or blocked (private mode). The app keeps working in memory.
  }
}

export function loadTheme(storage: KeyValueStore): Theme | null {
  try {
    const value = storage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function saveTheme(storage: KeyValueStore, theme: Theme): void {
  try {
    storage.setItem(THEME_KEY, theme)
  } catch {
    // Ignore: the theme simply will not persist.
  }
}
