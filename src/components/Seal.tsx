import type { ReactNode } from 'react'

interface SealProps {
  tone?: 'shu' | 'ai' | 'ash' | 'ink'
  children: ReactNode
}

/** A small square hanko-style stamp. Decorative: it always sits beside a text label. */
export function Seal({ tone = 'shu', children }: SealProps) {
  return (
    <span className="seal" data-tone={tone} aria-hidden="true" lang="ja">
      {children}
    </span>
  )
}
