export type Priority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  priority: Priority
  completed: boolean
  createdAt: number
  updatedAt: number
}

export type StatusFilter = 'all' | 'active' | 'completed'
export type PriorityFilter = 'all' | Priority

export interface Filters {
  query: string
  status: StatusFilter
  priority: PriorityFilter
}

export interface PriorityCount {
  total: number
  pending: number
}

export interface Stats {
  total: number
  completed: number
  pending: number
  /** Whole-number completion percentage, 0 when there are no tasks. */
  percent: number
  byPriority: Record<Priority, PriorityCount>
}

export type Route = 'tasks' | 'overview' | 'guide'
