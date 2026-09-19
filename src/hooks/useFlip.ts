import { useLayoutEffect, useRef, type RefObject } from 'react'
import { duration, ease, flipDelta, flipPaused, isMovement, reducedMotion, type Point } from '../lib/motion'

const FLIP_ID = 'flip'

/**
 * Animates the children of a list to their new positions whenever the list changes (a task is
 * added or removed, a filter changes, a row grows during editing). Children opt in with a
 * `data-flip-id`. It measures layout positions, so it stays correct when interrupted mid-move.
 *
 * It only animates when the list itself changed: the same rows in the same order at the same
 * heights means any position difference came from elsewhere (fonts loading, a resize), which
 * should not animate.
 */
export function useFlip(container: RefObject<HTMLElement | null>) {
  const previous = useRef(new Map<string, Point>())
  const previousShape = useRef('')

  useLayoutEffect(() => {
    const element = container.current
    if (!element) return
    const children = (Array.from(element.children) as HTMLElement[]).filter((child) => child.dataset.flipId)
    const shape = children.map((child) => `${child.dataset.flipId}:${child.offsetHeight}`).join('|')
    const next = new Map<string, Point>()
    const ms = duration('state')
    const animate = ms > 0 && !reducedMotion() && !flipPaused() && shape !== previousShape.current

    for (const child of children) {
      const id = child.dataset.flipId as string
      // Relative to the list, so a shift elsewhere on the page (fonts loading, a header change) never reads as row movement.
      const after = { x: child.offsetLeft - element.offsetLeft, y: child.offsetTop - element.offsetTop }
      next.set(id, after)
      const before = previous.current.get(id)
      if (!before || !animate) continue

      // If an earlier reflow is still running, continue from where it had got to.
      const matrix = new DOMMatrixReadOnly(getComputedStyle(child).transform)
      const delta = flipDelta(before, { x: matrix.m41, y: matrix.m42 }, after)
      if (!isMovement(delta)) continue
      child.getAnimations().find((animation) => animation.id === FLIP_ID)?.cancel()
      child.animate([{ transform: `translate(${delta.x}px, ${delta.y}px)` }, { transform: 'none' }], {
        id: FLIP_ID,
        duration: ms,
        // Rows that are already on screen and move use the in-out curve.
        easing: ease('in-out'),
      })
    }
    previous.current = next
    previousShape.current = shape
  })
}
