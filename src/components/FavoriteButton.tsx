import { useFavorite } from '../hooks/useFavorites'
import './FavoriteButton.css'

type Props = {
  productId: string
  className?: string
}

export function FavoriteButton({ productId, className = '' }: Props) {
  const { isFavorite, toggle } = useFavorite(productId)

  return (
    <button
      type="button"
      className={`fav-btn ${isFavorite ? 'is-active' : ''} ${className}`.trim()}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorite}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle()
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 20.2 10.7 19c-4.4-4-7.2-6.5-7.2-9.6A4.3 4.3 0 0 1 7.8 5c1.4 0 2.7.7 3.5 1.7C12.1 5.7 13.4 5 14.8 5a4.3 4.3 0 0 1 4.3 4.4c0 3.1-2.8 5.6-7.2 9.6L12 20.2Z"
          fill={isFavorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span className="fav-btn__label">{isFavorite ? 'Saved' : 'Favorite'}</span>
    </button>
  )
}
