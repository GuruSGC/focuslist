import type { Priority } from '../types'

export interface PriorityMeta {
  label: string
  /** Decorative kanji shown on the seal. Always paired with the English label. */
  kanji: string
  tone: 'shu' | 'ai' | 'ash'
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  high: { label: 'High', kanji: '高', tone: 'shu' },
  medium: { label: 'Medium', kanji: '中', tone: 'ai' },
  low: { label: 'Low', kanji: '低', tone: 'ash' },
}
