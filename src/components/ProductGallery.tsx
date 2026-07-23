import { useEffect, useState } from 'react'
import './ProductGallery.css'

type Props = {
  images: string[]
  alt: string
}

export function ProductGallery({ images, alt }: Props) {
  const gallery = images.length > 0 ? images : []
  const [active, setActive] = useState(0)

  useEffect(() => {
    setActive(0)
  }, [images])

  if (gallery.length === 0) return null

  const current = gallery[Math.min(active, gallery.length - 1)] ?? gallery[0]

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
              onClick={() => setActive(index)}
            >
              <img src={src} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
            </button>
          ))}
        </div>
      )}

      <figure className="product-gallery__stage">
        <img
          key={current}
          src={current}
          alt={active === 0 ? alt : `${alt} — photo ${active + 1}`}
          loading="eager"
        />
      </figure>
    </div>
  )
}
