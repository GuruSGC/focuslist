import { useEffect, useState } from 'react'

export interface ViewportSize {
  width: number
  height: number
}

const read = (): ViewportSize => ({ width: window.innerWidth, height: window.innerHeight })

/** Viewport size, updated at most once per frame while resizing. */
export function useViewport(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(read)

  useEffect(() => {
    let frame = 0
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = read()
        setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next))
      })
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return size
}
