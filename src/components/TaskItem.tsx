import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Check, PencilSimple, Trash, X } from '@phosphor-icons/react'
import type { SubmitResult } from '../hooks/useTasks'
import { ghostOut, shake, washFlash } from '../lib/motion'
import type { Priority, Task } from '../types'
import { PriorityChip } from './PriorityChip'
import { PriorityField } from './PriorityField'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onEdit: (id: string, title: string, priority: Priority) => SubmitResult
  onDelete: (id: string) => void
}

/** A row created in the last moment is new: it takes a brief wash so the eye finds it. */
const RECENT_MS = 1000

export function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const uid = useId()
  const titleId = `${uid}-title`
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const [draftPriority, setDraftPriority] = useState<Priority>(task.priority)
  const [error, setError] = useState<string | null>(null)
  const editButton = useRef<HTMLButtonElement>(null)
  const viewRow = useRef<HTMLLIElement>(null)
  const draftInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (Date.now() - task.createdAt < RECENT_MS && viewRow.current) washFlash(viewRow.current)
  }, [task.createdAt])

  const startEdit = () => {
    setDraft(task.title)
    setDraftPriority(task.priority)
    setError(null)
    setEditing(true)
  }

  const finishEdit = (saved: boolean) => {
    setEditing(false)
    // Return focus to where the user was once the row swaps back, and wash the row if it changed.
    requestAnimationFrame(() => {
      editButton.current?.focus()
      if (saved && viewRow.current) washFlash(viewRow.current)
    })
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    const result = onEdit(task.id, draft, draftPriority)
    if (result.ok) finishEdit(true)
    else {
      setError(result.error)
      if (draftInput.current) shake(draftInput.current)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      finishEdit(false)
    }
  }

  const remove = () => {
    // The row leaves the list at once; a hidden copy plays the exit.
    if (viewRow.current) ghostOut(viewRow.current)
    onDelete(task.id)
  }

  if (editing) {
    return (
      <li key="edit" className="task-edit plate p-3" data-testid="task-item" data-flip-id={task.id} data-editing="true">
        <form onSubmit={save} onKeyDown={onKeyDown} noValidate aria-label={`Edit ${task.title}`} className="grid gap-3">
          <div>
            <label htmlFor={`${uid}-input`} className="field-label">
              Task title
            </label>
            <input
              id={`${uid}-input`}
              ref={draftInput}
              className="field"
              type="text"
              name="title"
              autoComplete="off"
              // Deliberate: choosing Edit is a request to type, so focus moves straight into the field.
              autoFocus
              value={draft}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${uid}-error` : undefined}
              onChange={(event) => {
                setDraft(event.target.value)
                if (error) setError(null)
              }}
              onFocus={(event) => event.currentTarget.select()}
            />
            {error && (
              <p id={`${uid}-error`} className="field-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <PriorityField name={`${uid}-priority`} value={draftPriority} onChange={setDraftPriority} className="sm:max-w-sm" />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              <Check size={18} weight="bold" aria-hidden="true" />
              <span>Save</span>
            </button>
            <button type="button" className="btn" onClick={() => finishEdit(false)}>
              <X size={18} weight="bold" aria-hidden="true" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li key="view" ref={viewRow} className="task" data-completed={task.completed} data-testid="task-item" data-flip-id={task.id}>
      <label className="check">
        <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} aria-labelledby={titleId} />
        <span className="stamp" aria-hidden="true">
          <span lang="ja">済</span>
        </span>
      </label>

      <div className="min-w-0 py-1">
        <p id={titleId} className="task-title wrap-anywhere text-[1.0625rem] leading-snug font-medium" data-testid="task-title">
          <span className="strike">{task.title}</span>
        </p>
        <PriorityChip priority={task.priority} />
      </div>

      <div className="flex">
        <button ref={editButton} type="button" className="btn btn-quiet" aria-label={`Edit ${task.title}`} onClick={startEdit}>
          <PencilSimple size={20} aria-hidden="true" />
          <span className="max-sm:sr-only">Edit</span>
        </button>
        <button type="button" className="btn btn-quiet" aria-label={`Delete ${task.title}`} onClick={remove}>
          <Trash size={20} aria-hidden="true" />
          <span className="max-sm:sr-only">Delete</span>
        </button>
      </div>
    </li>
  )
}
