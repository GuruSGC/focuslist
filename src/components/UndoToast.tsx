import type { DeletedTask } from '../hooks/useTasks'

interface UndoToastProps {
  deleted: DeletedTask | null
  /** The toast is on its way out: still visible for a moment, but no longer interactive. */
  leaving: boolean
  onUndo: () => void
}

/** The status region stays mounted so screen readers announce the message when it appears. */
export function UndoToast({ deleted, leaving, onUndo }: UndoToastProps) {
  return (
    <div role="status" aria-live="polite">
      {deleted && (
        <div className="toast" data-leaving={leaving} data-testid={leaving ? undefined : 'undo-toast'} aria-hidden={leaving || undefined}>
          <span>Task deleted.</span>
          <button type="button" className="btn" onClick={onUndo} disabled={leaving}>
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
