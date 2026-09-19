import { PRIORITY_META } from '../lib/priority'
import type { Priority } from '../types'
import { Seal } from './Seal'

export function PriorityChip({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority]
  return (
    <span className="chip" data-priority={priority} data-testid="priority-chip">
      <Seal tone={meta.tone}>{meta.kanji}</Seal>
      <span>{meta.label}</span>
    </span>
  )
}
