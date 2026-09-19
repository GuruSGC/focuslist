import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { STORAGE_KEY, loadTasks, parseTasks, saveTasks } from '../lib/storage'
import { createId, taskReducer, validateTitle } from '../lib/tasks'
import type { Priority, Task } from '../types'

const UNDO_WINDOW_MS = 6000

export interface DeletedTask {
  task: Task
  index: number
}

export type SubmitResult = { ok: true } | { ok: false; error: string }

export interface TasksApi {
  tasks: Task[]
  deleted: DeletedTask | null
  addTask: (title: string, priority: Priority) => SubmitResult
  editTask: (id: string, title: string, priority: Priority) => SubmitResult
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
  undoRemove: () => void
  dismissUndo: () => void
}

export function useTasks(): TasksApi {
  const [tasks, dispatch] = useReducer(taskReducer, undefined, () => loadTasks(window.localStorage))
  const [deleted, setDeleted] = useState<DeletedTask | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    saveTasks(window.localStorage, tasks)
  }, [tasks])

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) dispatch({ type: 'replace', tasks: parseTasks(event.newValue) })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const dismissUndo = useCallback(() => {
    window.clearTimeout(timer.current)
    setDeleted(null)
  }, [])

  const addTask = useCallback((title: string, priority: Priority): SubmitResult => {
    const result = validateTitle(title)
    if (!result.ok) return result
    dispatch({ type: 'add', id: createId(), title: result.title, priority, now: Date.now() })
    return { ok: true }
  }, [])

  const editTask = useCallback((id: string, title: string, priority: Priority): SubmitResult => {
    const result = validateTitle(title)
    if (!result.ok) return result
    dispatch({ type: 'edit', id, title: result.title, priority, now: Date.now() })
    return { ok: true }
  }, [])

  const toggleTask = useCallback((id: string) => {
    dispatch({ type: 'toggle', id, now: Date.now() })
  }, [])

  const removeTask = useCallback(
    (id: string) => {
      const index = tasks.findIndex((task) => task.id === id)
      const task = tasks[index]
      if (!task) return
      dispatch({ type: 'remove', id })
      window.clearTimeout(timer.current)
      setDeleted({ task, index })
      timer.current = window.setTimeout(() => setDeleted(null), UNDO_WINDOW_MS)
    },
    [tasks],
  )

  const undoRemove = useCallback(() => {
    if (!deleted) return
    dispatch({ type: 'restore', task: deleted.task, index: deleted.index })
    dismissUndo()
  }, [deleted, dismissUndo])

  return { tasks, deleted, addTask, editTask, toggleTask, removeTask, undoRemove, dismissUndo }
}
