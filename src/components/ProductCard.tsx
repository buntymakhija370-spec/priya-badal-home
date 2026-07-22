import { Link } from 'react-router-dom'
import { formatPrice, type Product } from '../data/catalog'
import './ProductCard.css'

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  return (
    <Link className="product-card" to={`/product/${product.id}`}>
      <div className="product-card__media">
        <img src={product.image} alt={product.name} loading="lazy" />
      </div>
      <div className="product-card__body">
        <h3>{product.name}</h3>
        <p className="product-card__price">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}
