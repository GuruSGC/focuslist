import { describe, expect, it } from 'vitest'
import {
  MAX_TITLE_LENGTH,
  computeStats,
  filterTasks,
  taskReducer,
  validateTitle,
} from '../src/lib/tasks'
import type { Filters, Task } from '../src/types'

const make = (over: Partial<Task> & { id: string }): Task => ({
  title: 'Task',
  priority: 'medium',
  completed: false,
  createdAt: 1,
  updatedAt: 1,
  ...over,
})

const noFilters: Filters = { query: '', status: 'all', priority: 'all' }

describe('validateTitle', () => {
  it('trims and accepts a normal title', () => {
    expect(validateTitle('  Buy tea  ')).toEqual({ ok: true, title: 'Buy tea' })
  })

  it('rejects empty and whitespace-only titles', () => {
    expect(validateTitle('')).toMatchObject({ ok: false })
    expect(validateTitle('   \t ')).toMatchObject({ ok: false })
  })

  it('rejects titles longer than the maximum', () => {
    const result = validateTitle('x'.repeat(MAX_TITLE_LENGTH + 1))
    expect(result).toMatchObject({ ok: false })
    expect(validateTitle('x'.repeat(MAX_TITLE_LENGTH))).toMatchObject({ ok: true })
  })
})

describe('taskReducer', () => {
  it('adds a task at the front with its priority', () => {
    const first = taskReducer([], { type: 'add', id: 'a', title: 'One', priority: 'high', now: 10 })
    const second = taskReducer(first, { type: 'add', id: 'b', title: 'Two', priority: 'low', now: 20 })
    expect(second.map((t) => t.id)).toEqual(['b', 'a'])
    expect(second[1]).toMatchObject({ title: 'One', priority: 'high', completed: false, createdAt: 10 })
  })

  it('toggles completion and stamps updatedAt', () => {
    const state = [make({ id: 'a' })]
    const done = taskReducer(state, { type: 'toggle', id: 'a', now: 99 })
    expect(done[0]).toMatchObject({ completed: true, updatedAt: 99 })
    expect(taskReducer(done, { type: 'toggle', id: 'a', now: 100 })[0]?.completed).toBe(false)
  })

  it('edits title and priority without touching other tasks', () => {
    const state = [make({ id: 'a', title: 'Old' }), make({ id: 'b', title: 'Keep' })]
    const next = taskReducer(state, { type: 'edit', id: 'a', title: 'New', priority: 'high', now: 5 })
    expect(next[0]).toMatchObject({ title: 'New', priority: 'high', updatedAt: 5 })
    expect(next[1]).toEqual(state[1])
  })

  it('removes a task and restores it at its original index', () => {
    const state = [make({ id: 'a' }), make({ id: 'b' }), make({ id: 'c' })]
    const removed = taskReducer(state, { type: 'remove', id: 'b' })
    expect(removed.map((t) => t.id)).toEqual(['a', 'c'])
    const restored = taskReducer(removed, { type: 'restore', task: state[1]!, index: 1 })
    expect(restored.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('does not restore a task that already exists', () => {
    const state = [make({ id: 'a' })]
    expect(taskReducer(state, { type: 'restore', task: state[0]!, index: 0 })).toHaveLength(1)
  })

  it('replaces the whole list', () => {
    const next = taskReducer([make({ id: 'a' })], { type: 'replace', tasks: [make({ id: 'z' })] })
    expect(next.map((t) => t.id)).toEqual(['z'])
  })
})

describe('filterTasks', () => {
  const tasks = [
    make({ id: '1', title: 'Write report', priority: 'high' }),
    make({ id: '2', title: 'Water plants', priority: 'low', completed: true }),
    make({ id: '3', title: 'Read chapter', priority: 'medium' }),
    make({ id: '4', title: 'Report expenses', priority: 'high', completed: true }),
  ]
  const ids = (list: Task[]) => list.map((t) => t.id)

  it('returns everything with no filters', () => {
    expect(ids(filterTasks(tasks, noFilters))).toEqual(['1', '2', '3', '4'])
  })

  it('searches titles case-insensitively and ignores surrounding spaces', () => {
    expect(ids(filterTasks(tasks, { ...noFilters, query: '  REPORT ' }))).toEqual(['1', '4'])
  })

  it('filters by status', () => {
    expect(ids(filterTasks(tasks, { ...noFilters, status: 'active' }))).toEqual(['1', '3'])
    expect(ids(filterTasks(tasks, { ...noFilters, status: 'completed' }))).toEqual(['2', '4'])
  })

  it('filters by priority', () => {
    expect(ids(filterTasks(tasks, { ...noFilters, priority: 'high' }))).toEqual(['1', '4'])
  })

  it('combines search, status and priority', () => {
    const combined: Filters = { query: 'report', status: 'completed', priority: 'high' }
    expect(ids(filterTasks(tasks, combined))).toEqual(['4'])
    expect(filterTasks(tasks, { query: 'zzz', status: 'all', priority: 'all' })).toEqual([])
  })
})

describe('computeStats', () => {
  it('reports zeros for an empty list', () => {
    expect(computeStats([])).toEqual({
      total: 0,
      completed: 0,
      pending: 0,
      percent: 0,
      byPriority: {
        high: { total: 0, pending: 0 },
        medium: { total: 0, pending: 0 },
        low: { total: 0, pending: 0 },
      },
    })
  })

  it('counts totals, completed, pending, percent and priority breakdown', () => {
    const stats = computeStats([
      make({ id: '1', priority: 'high' }),
      make({ id: '2', priority: 'high', completed: true }),
      make({ id: '3', priority: 'low', completed: true }),
      make({ id: '4', priority: 'medium' }),
    ])
    expect(stats).toMatchObject({ total: 4, completed: 2, pending: 2, percent: 50 })
    expect(stats.byPriority.high).toEqual({ total: 2, pending: 1 })
    expect(stats.byPriority.low).toEqual({ total: 1, pending: 0 })
    expect(stats.byPriority.medium).toEqual({ total: 1, pending: 1 })
  })

  it('rounds the completion percentage', () => {
    const tasks = [make({ id: '1', completed: true }), make({ id: '2' }), make({ id: '3' })]
    expect(computeStats(tasks).percent).toBe(33)
  })
})
