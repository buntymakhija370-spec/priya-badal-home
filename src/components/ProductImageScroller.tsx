import { useEffect, useRef, useState } from 'react'
import type { MediaItem } from '../lib/media'
import './ProductImageScroller.css'

type Props = {
  media: MediaItem[]
  alt: string
  className?: string
}

export function ProductImageScroller({ media, alt, className = '' }: Props) {
  const gallery = media.length > 0 ? media : []
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const touchRef = useRef<{ x: number; y: number; locked: 'x' | 'y' | null }>({
    x: 0,
    y: 0,
    locked: null,
  })

  useEffect(() => {
    const el = scrollerRef.current
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
    const el = scrollerRef.current
    if (!el) return

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
  }, [])

  if (gallery.length === 0) return null

  const goTo = (index: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className={`img-scroller ${className}`.trim()}>
      <div
        ref={scrollerRef}
        className="img-scroller__track"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${alt} media`}
      >
        {gallery.map((item, index) => (
          <figure key={`${item.src}-${index}`} className="img-scroller__slide">
            {item.type === 'video' ? (
              <>
                <video
                  className="img-scroller__video"
                  src={item.src}
                  poster={item.poster}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  aria-label={`${alt} video`}
                />
                <span className="img-scroller__video-badge" aria-hidden="true">
                  Video
                </span>
              </>
            ) : (
              <img
                src={item.src}
                alt={index === 0 ? alt : `${alt} — photo ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            )}
          </figure>
        ))}
      </div>

      {gallery.length > 1 && (
        <div className="img-scroller__dots" role="tablist" aria-label="Media position">
          {gallery.map((item, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={
                item.type === 'video' ? `Video ${index + 1}` : `Photo ${index + 1}`
              }
              className={
                index === active ? 'img-scroller__dot is-active' : 'img-scroller__dot'
              }
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goTo(index)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
