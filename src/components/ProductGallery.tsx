import { useEffect, useRef, useState } from 'react'
import type { MediaItem } from '../lib/media'
import './ProductGallery.css'

type Props = {
  media: MediaItem[]
  alt: string
}

export function ProductGallery({ media, alt }: Props) {
  const gallery = media.length > 0 ? media : []
  const trackRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())
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
  }, [media])

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

  // Pause off-screen videos; try play the active one
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (index === active) {
        video.play().catch(() => {
          /* autoplay may be blocked until user taps */
        })
      } else {
        video.pause()
      }
    })
  }, [active])

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
        <div className="product-gallery__thumbs" role="tablist" aria-label="Product media">
          {gallery.map((item, index) => (
            <button
              key={`${item.src}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={item.type === 'video' ? `Video ${index + 1}` : `Photo ${index + 1}`}
              className={
                index === active
                  ? 'product-gallery__thumb is-active'
                  : 'product-gallery__thumb'
              }
              onClick={() => goTo(index)}
            >
              {item.type === 'video' ? (
                <>
                  <img src={item.poster || item.src} alt="" loading="lazy" />
                  <span className="product-gallery__thumb-play" aria-hidden="true">
                    ▶
                  </span>
                </>
              ) : (
                <img src={item.src} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
              )}
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
          aria-label={`${alt} media`}
        >
          {gallery.map((item, index) => (
            <figure key={`${item.src}-${index}`} className="product-gallery__slide">
              {item.type === 'video' ? (
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(index, el)
                    else videoRefs.current.delete(index)
                  }}
                  className="product-gallery__video"
                  src={item.src}
                  poster={item.poster}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={`${alt} video`}
                />
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
          <div className="product-gallery__dots" role="tablist" aria-label="Media position">
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
