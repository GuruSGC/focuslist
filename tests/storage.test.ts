import { describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  THEME_KEY,
  loadTasks,
  loadTheme,
  parseTasks,
  saveTasks,
  saveTheme,
} from '../src/lib/storage'
import type { Task } from '../src/types'

class MemoryStorage {
  private data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

const task: Task = {
  id: 'a',
  title: 'Persist me',
  priority: 'high',
  completed: true,
  createdAt: 1,
  updatedAt: 2,
}

describe('task storage', () => {
  it('round-trips tasks', () => {
    const storage = new MemoryStorage()
    saveTasks(storage, [task])
    expect(loadTasks(storage)).toEqual([task])
  })

  it('returns an empty list when nothing is stored', () => {
    expect(loadTasks(new MemoryStorage())).toEqual([])
  })

  it('survives corrupted JSON', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, '{not json')
    expect(loadTasks(storage)).toEqual([])
  })

  it('survives a non-array payload', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ tasks: 'nope' }))
    expect(loadTasks(storage)).toEqual([])
  })

  it('drops invalid entries but keeps valid ones', () => {
    const raw = JSON.stringify([task, { id: 1 }, null, 'x', { ...task, id: 'b', priority: 'urgent' }])
    expect(parseTasks(raw).map((t) => t.id)).toEqual(['a'])
  })

  it('does not throw when storage is unavailable', () => {
    const broken = {
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('blocked')
      },
    }
    expect(loadTasks(broken)).toEqual([])
    expect(() => saveTasks(broken, [task])).not.toThrow()
  })
})

describe('theme storage', () => {
  it('round-trips a valid theme', () => {
    const storage = new MemoryStorage()
    saveTheme(storage, 'dark')
    expect(loadTheme(storage)).toBe('dark')
  })

  it('ignores unknown values', () => {
    const storage = new MemoryStorage()
    storage.setItem(THEME_KEY, 'purple')
    expect(loadTheme(storage)).toBeNull()
  })
})
