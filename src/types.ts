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

export interface PaintingImage {
  avif: string
  webp: string
  width: number
  height: number
}

/** A real public-domain print used as a page background. Credits come from the Met Open Access API. */
export interface Painting {
  id: number
  slug: string
  title: string
  artist: string
  date: string
  creditLine: string
  objectUrl: string
  /** Average colour of the print, shown until the image has decoded. */
  color: string
  positionDesktop: string
  positionMobile: string
  desktop: PaintingImage
  mobile: PaintingImage
}
