import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import type { MediaItem } from '../lib/media'
import './ProductImageScroller.css'

type Props = {
  media: MediaItem[]
  alt: string
  className?: string
  /** When set, a clean tap (not a swipe) opens this product route */
  to?: string
}

const TAP_MOVE_PX = 10

export function ProductImageScroller({
  media,
  alt,
  className = '',
  to,
}: Props) {
  const navigate = useNavigate()
  const gallery = media.length > 0 ? media : []
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const gestureRef = useRef<{
    x: number
    y: number
    locked: 'x' | 'y' | null
    moved: boolean
  }>({ x: 0, y: 0, locked: null, moved: false })

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
      gestureRef.current = {
        x: t.clientX,
        y: t.clientY,
        locked: null,
        moved: false,
      }
      el.style.overflowX = gallery.length > 1 ? 'auto' : 'hidden'
    }

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      const dx = Math.abs(t.clientX - gestureRef.current.x)
      const dy = Math.abs(t.clientY - gestureRef.current.y)

      if (dx > TAP_MOVE_PX || dy > TAP_MOVE_PX) {
        gestureRef.current.moved = true
      }

      if (!gestureRef.current.locked && (dx > 6 || dy > 6)) {
        gestureRef.current.locked = dx > dy ? 'x' : 'y'
      }

      // Vertical page scroll: lock out horizontal carousel jank
      if (gestureRef.current.locked === 'y') {
        el.style.overflowX = 'hidden'
      }
    }

    const onTouchEnd = () => {
      el.style.overflowX = gallery.length > 1 ? 'auto' : 'hidden'
      // Keep `moved` / `locked` until the synthetic click runs, then clear
      window.setTimeout(() => {
        gestureRef.current.locked = null
        gestureRef.current.moved = false
      }, 50)
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
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    gestureRef.current = {
      x: e.clientX,
      y: e.clientY,
      locked: null,
      moved: false,
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    const dx = Math.abs(e.clientX - gestureRef.current.x)
    const dy = Math.abs(e.clientY - gestureRef.current.y)
    if (dx > TAP_MOVE_PX || dy > TAP_MOVE_PX) {
      gestureRef.current.moved = true
    }
  }

  const onActivate = () => {
    if (!to || gestureRef.current.moved || gestureRef.current.locked === 'x') {
      return
    }
    navigate(to)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!to) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(to)
    }
  }

  return (
    <div className={`img-scroller ${className}`.trim()}>
      <div
        ref={scrollerRef}
        className={
          gallery.length > 1
            ? 'img-scroller__track'
            : 'img-scroller__track img-scroller__track--single'
        }
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${alt} media`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onClick={onActivate}
        onKeyDown={onKeyDown}
        style={to ? { cursor: 'pointer' } : undefined}
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
                gestureRef.current.moved = true
                goTo(index)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
