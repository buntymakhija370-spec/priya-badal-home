import { useEffect, useRef, useState } from 'react'
import './ProductGallery.css'

type Props = {
  images: string[]
  alt: string
}

export function ProductGallery({ images, alt }: Props) {
  const gallery = images.length > 0 ? images : []
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const touchRef = useRef<{ x: number; y: number; locked: 'x' | 'y' | null }>({
    x: 0,
    y: 0,
    locked: null,
  })

  useEffect(() => {
    setActive(0)
    const el = trackRef.current
    if (el) el.scrollTo({ left: 0 })
  }, [images])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    const onScroll = () => {
      const width = el.clientWidth || 1
      const index = Math.round(el.scrollLeft / width)
      setActive(Math.min(gallery.length - 1, Math.max(0, index)))
    }

    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [gallery.length])

  useEffect(() => {
    const el = trackRef.current
    if (!el || gallery.length < 2) return

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      touchRef.current = { x: t.clientX, y: t.clientY, locked: null }
      el.style.overflowX = 'auto'
    }

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      const dx = Math.abs(t.clientX - touchRef.current.x)
      const dy = Math.abs(t.clientY - touchRef.current.y)

      if (!touchRef.current.locked && (dx > 6 || dy > 6)) {
        touchRef.current.locked = dx > dy ? 'x' : 'y'
      }

      // Vertical scroll intent: don't trap the gesture in the gallery
      if (touchRef.current.locked === 'y') {
        el.style.overflowX = 'hidden'
      }
    }

    const onTouchEnd = () => {
      el.style.overflowX = 'auto'
      touchRef.current.locked = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [gallery.length])

  if (gallery.length === 0) return null

  const goTo = (index: number) => {
    const el = trackRef.current
    if (!el) return
    const next = Math.min(gallery.length - 1, Math.max(0, index))
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
    setActive(next)
  }

  return (
    <div className="product-gallery">
      {gallery.length > 1 && (
        <div className="product-gallery__thumbs" role="tablist" aria-label="Product photos">
          {gallery.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Photo ${index + 1}`}
              className={
                index === active
                  ? 'product-gallery__thumb is-active'
                  : 'product-gallery__thumb'
              }
              onClick={() => goTo(index)}
            >
              <img src={src} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
            </button>
          ))}
        </div>
      )}

      <div className="product-gallery__stage">
        <div
          ref={trackRef}
          className="product-gallery__track"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${alt} photos`}
        >
          {gallery.map((src, index) => (
            <figure key={`${src}-${index}`} className="product-gallery__slide">
              <img
                src={src}
                alt={index === 0 ? alt : `${alt} — photo ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </figure>
          ))}
        </div>

        {gallery.length > 1 && (
          <div className="product-gallery__dots" role="tablist" aria-label="Photo position">
            {gallery.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={`Photo ${index + 1}`}
                className={
                  index === active
                    ? 'product-gallery__dot is-active'
                    : 'product-gallery__dot'
                }
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
