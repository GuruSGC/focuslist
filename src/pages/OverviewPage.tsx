import { useMemo, type CSSProperties } from 'react'
import { PriorityChip } from '../components/PriorityChip'
import { Stats } from '../components/Stats'
import { PRIORITIES, computeStats } from '../lib/tasks'
import type { Task } from '../types'

const RANK = { high: 0, medium: 1, low: 2 } as const
const NEXT_UP_LIMIT = 3

export function OverviewPage({ tasks }: { tasks: Task[] }) {
  const stats = useMemo(() => computeStats(tasks), [tasks])
  const nextUp = useMemo(
    () =>
      tasks
        .filter((task) => !task.completed)
        .sort((a, b) => RANK[a.priority] - RANK[b.priority] || a.createdAt - b.createdAt)
        .slice(0, NEXT_UP_LIMIT),
    [tasks],
  )

  return (
    <div className="page pt-2 sm:pt-6">
      <h1 id="page-title" tabIndex={-1} className="text-3xl sm:text-4xl">
        Overview
      </h1>

      <div className="sheet mt-3 sm:mt-4">
        <section aria-labelledby="progress-heading" className="p-4">
          <h2 id="progress-heading" className="mb-3 text-lg">
            Progress
          </h2>
          <Stats stats={stats} size="large" />
          <div
            className="meter mt-4"
            role="progressbar"
            aria-label="Completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stats.percent}
          >
            <span style={{ '--value': stats.percent / 100 } as CSSProperties} />
          </div>
          <p className="mt-2 text-sm text-sumi-soft">
            <span className="font-bold text-sumi" data-testid="overview-percent">
              {stats.percent}%
            </span>{' '}
            complete, {stats.completed} of {stats.total} {stats.total === 1 ? 'task' : 'tasks'} done
          </p>
        </section>

        <section aria-labelledby="priority-heading" className="p-4">
          <h2 id="priority-heading" className="mb-3 text-lg">
            By Priority
          </h2>
          <ul className="grid gap-3">
            {PRIORITIES.map((priority) => {
              const bucket = stats.byPriority[priority]
              const share = stats.total === 0 ? 0 : bucket.total / stats.total
              return (
                <li key={priority} data-testid={`priority-${priority}`}>
                  <div className="flex items-center justify-between gap-3">
                    <PriorityChip priority={priority} />
                    <span className="text-sm text-sumi-soft">
                      {bucket.total} {bucket.total === 1 ? 'task' : 'tasks'}, {bucket.pending} pending
                    </span>
                  </div>
                  <div className="meter mt-1.5" aria-hidden="true">
                    <span style={{ '--value': share } as CSSProperties} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="next-heading" className="p-4">
          <h2 id="next-heading" className="mb-3 text-lg">
            Up Next
          </h2>
          {nextUp.length === 0 ? (
            <p className="text-sumi-soft" data-testid="next-empty">
              {stats.total === 0 ? 'Nothing planned yet. Add a task on the Tasks page.' : 'Everything is done. Well finished.'}
            </p>
          ) : (
            <ol className="grid gap-2" data-testid="next-list">
              {nextUp.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 wrap-anywhere font-medium">{task.title}</span>
                  <PriorityChip priority={task.priority} />
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
