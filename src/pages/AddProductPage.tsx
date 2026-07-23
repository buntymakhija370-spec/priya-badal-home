import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categories, type CategoryId } from '../data/catalog'
import { addCustomProduct } from '../lib/products'
import './AddProductPage.css'

const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
]

export function AddProductPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<CategoryId>('wall-panels')
  const [subcategoryId, setSubcategoryId] = useState('fluted')
  const [price, setPrice] = useState('9999')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(SAMPLE_PHOTOS[0]!)
  const [photoFilePreview, setPhotoFilePreview] = useState<string | null>(null)
  const [error, setError] = useState('')

  const subs = useMemo(
    () => categories.find((c) => c.id === categoryId)?.subcategories ?? [],
    [categoryId],
  )

  const onCategoryChange = (id: CategoryId) => {
    setCategoryId(id)
    const first = categories.find((c) => c.id === id)?.subcategories[0]
    if (first) setSubcategoryId(first.id)
  }

  const onFile = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      setPhotoFilePreview(result)
      setImage(result)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const parsedPrice = Number(price)
    if (!name.trim() || !description.trim() || !image.trim()) {
      setError('Name, description, and photo are required.')
      return
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Enter a valid price.')
      return
    }

    const product = addCustomProduct({
      name,
      categoryId,
      subcategoryId,
      price: parsedPrice,
      description,
      image,
    })
    navigate(`/product/${product.id}`)
  }

  return (
    <main className="add-page page-pad">
      <header className="add-page__header">
        <p className="eyebrow">Studio tools</p>
        <h1>Add product & photograph</h1>
        <p>
          Upload a photo or paste an image link, set the category, subcategory,
          and price. Saved products appear in Shop and the AI Guide.
        </p>
      </header>

      <form className="add-form" onSubmit={onSubmit}>
        <label>
          Product name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rattan Accent Chair"
            required
          />
        </label>

        <div className="add-form__row">
          <label>
            Category
            <select
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value as CategoryId)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Subcategory
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
            >
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Price (INR)
          <input
            type="number"
            min={1}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Materials, size feel, where it works best…"
            required
          />
        </label>

        <fieldset className="add-form__photos">
          <legend>Photograph</legend>
          <label className="file-label">
            Upload photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            Or image URL
            <input
              value={photoFilePreview ? '' : image.startsWith('data:') ? '' : image}
              onChange={(e) => {
                setPhotoFilePreview(null)
                setImage(e.target.value)
              }}
              placeholder="https://…"
            />
          </label>
          <div className="sample-photos">
            {SAMPLE_PHOTOS.map((url) => (
              <button
                key={url}
                type="button"
                className={image === url ? 'sample is-active' : 'sample'}
                onClick={() => {
                  setPhotoFilePreview(null)
                  setImage(url)
                }}
              >
                <img src={url} alt="" />
              </button>
            ))}
          </div>
          {image && (
            <div className="preview">
              <img src={image} alt="Product preview" />
            </div>
          )}
        </fieldset>

        {error && <p className="form-error">{error}</p>}

        <div className="add-form__actions">
          <button className="btn btn--dark" type="submit">
            Save product
          </button>
          <Link className="btn btn--outline" to="/shop">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  )
}
