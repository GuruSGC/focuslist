import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { PAINTINGS } from '../data/paintings'
import { duration } from '../lib/motion'
import type { Painting, Route } from '../types'

interface Layer {
  id: number
  route: Route
}

function Print({ painting, first }: { painting: Painting; first: boolean }) {
  const style = {
    '--painting-color': painting.color,
    '--pos-desktop': painting.positionDesktop,
    '--pos-mobile': painting.positionMobile,
  } as CSSProperties
  return (
    <div className="painting" data-painting={painting.slug} style={style}>
      <picture>
        <source media="(max-width: 899px)" type="image/avif" srcSet={painting.mobile.avif} />
        <source media="(max-width: 899px)" type="image/webp" srcSet={painting.mobile.webp} />
        <source type="image/avif" srcSet={painting.desktop.avif} />
        <source type="image/webp" srcSet={painting.desktop.webp} />
        <img
          src={painting.desktop.webp}
          alt=""
          width={painting.desktop.width}
          height={painting.desktop.height}
          decoding="async"
          fetchPriority={first ? 'high' : 'auto'}
          draggable={false}
        />
      </picture>
    </div>
  )
}

/**
 * The page background: a real public-domain print for each page. Navigating stacks the new print
 * above the old one, which fades in over it and is then removed, so exactly one remains.
 * Decorative, so it is hidden from assistive tech and never receives input.
 */
export function PaintingBackdrop({ route }: { route: Route }) {
  const [layers, setLayers] = useState<Layer[]>([{ id: 0, route }])
  const counter = useRef(0)

  useEffect(() => {
    setLayers((current) => (current.at(-1)?.route === route ? current : [...current, { id: (counter.current += 1), route }]))
  }, [route])

  useEffect(() => {
    if (layers.length < 2) return
    const timer = window.setTimeout(() => setLayers((current) => current.slice(-1)), duration('page') + 60)
    return () => window.clearTimeout(timer)
  }, [layers])

  return (
    <div aria-hidden="true" data-testid="painting-backdrop">
      {layers.map((layer) => (
        <Print key={layer.id} painting={PAINTINGS[layer.route]} first={layer.id === 0} />
      ))}
    </div>
  )
}
