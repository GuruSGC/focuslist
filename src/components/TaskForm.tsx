import { useState, type FormEvent, type RefObject } from 'react'
import { Plus } from '@phosphor-icons/react'
import type { SubmitResult } from '../hooks/useTasks'
import { shake } from '../lib/motion'
import type { Priority } from '../types'
import { PriorityField } from './PriorityField'

interface TaskFormProps {
  onAdd: (title: string, priority: Priority) => SubmitResult
  inputRef: RefObject<HTMLInputElement | null>
}

export function TaskForm({ onAdd, inputRef }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const result = onAdd(title, priority)
    if (result.ok) {
      setTitle('')
      setError(null)
    } else {
      setError(result.error)
      // Shake the whole input-and-button row, so the movement is easy to see.
      if (inputRef.current) shake(inputRef.current.parentElement ?? inputRef.current)
    }
    inputRef.current?.focus()
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label="Add a task"
      className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
    >
      <div>
        <label htmlFor="new-task" className="field-label max-sm:sr-only">
          New task
        </label>
        <div className="flex gap-2">
          <input
            id="new-task"
            ref={inputRef}
            className="field"
            type="text"
            name="title"
            autoComplete="off"
            placeholder="What needs doing…"
            value={title}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'new-task-error' : undefined}
            onChange={(event) => {
              setTitle(event.target.value)
              if (error) setError(null)
            }}
          />
          <button type="submit" className="btn btn-primary shrink-0">
            <Plus size={18} weight="bold" aria-hidden="true" />
            <span>Add Task</span>
          </button>
        </div>
        {error && (
          <p id="new-task-error" className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <PriorityField name="new-priority" value={priority} onChange={setPriority} className="sm:max-w-sm lg:w-[21rem] lg:max-w-none" />
    </form>
  )
}
