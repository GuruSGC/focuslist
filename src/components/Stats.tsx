import type { Stats as StatsData } from '../types'
import { Seal } from './Seal'

interface StatsProps {
  stats: StatsData
  /** `compact` is an inline strip beside a page title; `large` is a row of big figures. */
  size?: 'compact' | 'large'
  className?: string
}

const ITEMS = [
  { key: 'total', label: 'Total Tasks', kanji: '全', tone: 'ai' },
  { key: 'completed', label: 'Completed', kanji: '済', tone: 'ink' },
  { key: 'pending', label: 'Pending', kanji: '残', tone: 'ash' },
] as const

/** Live task statistics. Unboxed: the caller decides what surface it sits on. */
export function Stats({ stats, size = 'compact', className = '' }: StatsProps) {
  const large = size === 'large'
  return (
    <section aria-label="Task statistics" className={className} data-testid="stats">
      <dl className={`grid grid-cols-3 gap-2 ${large ? 'sm:gap-6' : 'sm:flex sm:gap-x-6'}`}>
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className={`flex flex-col gap-1 ${large ? '' : 'sm:flex-row sm:items-baseline sm:gap-2'}`}
            data-testid={`stat-${item.key}`}
          >
            <dt className="flex items-center gap-2 text-[0.8125rem] font-medium text-sumi-soft sm:text-sm">
              <span className="max-sm:hidden">
                <Seal tone={item.tone}>{item.kanji}</Seal>
              </span>
              <span>{item.label}</span>
            </dt>
            <dd
              className={`font-display leading-none font-bold tabular-nums ${large ? 'text-4xl' : 'text-2xl'}`}
              data-testid={`stat-${item.key}-value`}
            >
              {/* Keyed by value so a changed figure rolls in instead of swapping silently. */}
              <span key={stats[item.key]} className="roll">
                {stats[item.key]}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
