import type { DeletedTask } from '../hooks/useTasks'

interface UndoToastProps {
  deleted: DeletedTask | null
  onUndo: () => void
}

/** The status region stays mounted so screen readers announce the message when it appears. */
export function UndoToast({ deleted, onUndo }: UndoToastProps) {
  return (
    <div role="status" aria-live="polite">
      {deleted && (
        <div className="toast" data-testid="undo-toast">
          <span>Task deleted.</span>
          <button type="button" className="btn" onClick={onUndo}>
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
