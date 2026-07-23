import { useEffect, useRef, useState } from 'react'
import './ProductImageScroller.css'

type Props = {
  images: string[]
  alt: string
  className?: string
  /** When true, tapping an image does not navigate — used inside cards with separate links */
  stopLinkNav?: boolean
}

export function ProductImageScroller({
  images,
  alt,
  className = '',
  stopLinkNav = false,
}: Props) {
  const gallery = images.length > 0 ? images : []
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

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
        aria-label={`${alt} photos`}
        onClick={stopLinkNav ? (e) => e.preventDefault() : undefined}
      >
        {gallery.map((src, index) => (
          <figure key={`${src}-${index}`} className="img-scroller__slide">
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
        <div className="img-scroller__dots" role="tablist" aria-label="Photo position">
          {gallery.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Photo ${index + 1}`}
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
