import type { SubmitResult } from '../hooks/useTasks'
import type { Priority, Task } from '../types'
import { EmptyState } from './EmptyState'
import { TaskItem } from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  totalCount: number
  onToggle: (id: string) => void
  onEdit: (id: string, title: string, priority: Priority) => SubmitResult
  onDelete: (id: string) => void
  onClearFilters: () => void
}

export function TaskList({ tasks, totalCount, onToggle, onEdit, onDelete, onClearFilters }: TaskListProps) {
  return (
    <section aria-label="Task list" className="grid content-start gap-2">
      <p role="status" className="w-fit bg-paper/85 pr-2 text-sm text-sumi-soft" data-testid="results-count">
        {totalCount === 0 ? 'No tasks yet' : `Showing ${tasks.length} of ${totalCount} ${totalCount === 1 ? 'task' : 'tasks'}`}
      </p>
      {totalCount === 0 ? (
        <EmptyState kind="empty" onClearFilters={onClearFilters} />
      ) : tasks.length === 0 ? (
        <EmptyState kind="no-results" onClearFilters={onClearFilters} />
      ) : (
        <ul className="grid gap-2" data-testid="task-list">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  )
}
