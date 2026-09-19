interface EmptyStateProps {
  kind: 'empty' | 'no-results'
  onClearFilters: () => void
}

/** Ink circle (enso) with a short prompt. Shown when there are no tasks or no matches. */
export function EmptyState({ kind, onClearFilters }: EmptyStateProps) {
  return (
    <div className="empty plate flex items-center gap-4 p-3 sm:p-5" data-testid={kind === 'empty' ? 'empty-state' : 'no-results'}>
      <svg viewBox="0 0 64 64" className="size-12 shrink-0 text-sumi sm:size-16" aria-hidden="true" focusable="false">
        <path
          d="M32 8C18 8 8 19 8 33c0 13 10 23 24 23s24-10 24-23c0-7-3-13-8-17"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      {kind === 'empty' ? (
        <div>
          <p className="font-display text-xl font-bold">No tasks yet</p>
          <p className="text-sumi-soft">Add your first task above and it will appear here.</p>
        </div>
      ) : (
        <div>
          <p className="font-display text-xl font-bold">No matching tasks</p>
          <p className="text-sumi-soft">Nothing fits the current search and filters.</p>
          <button type="button" className="btn mt-2" onClick={onClearFilters}>
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}
