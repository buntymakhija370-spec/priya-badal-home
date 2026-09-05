import { useRef, useState } from 'react'
import { compressImageToDataUrl } from '../compressImage'
import { deleteStagePhoto, uploadStagePhoto } from '../api'
import type { DepartmentId, StagePhotoProof, WorkshopOrder } from '../types'

type Props = {
  orderId: string
  departmentId: DepartmentId
  departmentLabel: string
  photos: StagePhotoProof[]
  uploadedBy?: string
  disabled?: boolean
  onOrderChange: (order: WorkshopOrder) => void
  onError?: (message: string) => void
  onMessage?: (message: string) => void
}

export function StagePhotoProofPanel({
  orderId,
  departmentId,
  departmentLabel,
  photos,
  uploadedBy,
  disabled,
  onOrderChange,
  onError,
  onMessage,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)

  async function onPick(file: File | null) {
    if (!file) return
    setBusy(true)
    onError?.('')
    try {
      const { dataUrl, fileName } = await compressImageToDataUrl(file)
      const res = await uploadStagePhoto({
        orderId,
        departmentId,
        dataUrl,
        caption: caption.trim() || undefined,
        uploadedBy: uploadedBy?.trim() || undefined,
        fileName,
      })
      onOrderChange(res.order)
      setCaption('')
      onMessage?.(`Photo proof posted for ${departmentLabel}`)
      if (inputRef.current) inputRef.current.value = ''
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Could not upload photo')
    } finally {
      setBusy(false)
    }
  }

  async function remove(photoId: string) {
    setBusy(true)
    onError?.('')
    try {
      const res = await deleteStagePhoto(orderId, departmentId, photoId)
      onOrderChange(res.order)
      onMessage?.('Photo removed')
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Could not remove photo')
    } finally {
      setBusy(false)
    }
  }

  const ready = photos.length > 0

  return (
    <div className="ws-photo-proof">
      <div className="ws-photo-proof__head">
        <div>
          <h3>Product photo proof</h3>
          <p className="ws-hint">
            {departmentLabel} must post at least one product photograph before this stage can be
            confirmed. Photos stay with the order for the next department.
          </p>
        </div>
        <span className={`ws-pill ${ready ? 'ws-pill--ok' : 'ws-pill--warn'}`}>
          {ready ? `${photos.length} proof photo(s)` : 'Photo required'}
        </span>
      </div>

      {photos.length ? (
        <div className="ws-photo-grid">
          {photos.map((p) => (
            <figure key={p.id} className="ws-photo-card">
              <a href={p.dataUrl} target="_blank" rel="noreferrer">
                <img src={p.dataUrl} alt={p.caption || 'Stage proof'} />
              </a>
              <figcaption>
                <span>{p.caption || p.fileName || 'Proof'}</span>
                <small>
                  {p.uploadedBy ? `${p.uploadedBy} · ` : ''}
                  {new Date(p.uploadedAt).toLocaleString('en-IN')}
                </small>
                <button
                  type="button"
                  className="ws-btn ws-btn--ghost"
                  disabled={busy || disabled}
                  onClick={() => void remove(p.id)}
                >
                  Remove
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="ws-hint ws-photo-proof__empty">No proof photos yet for this department.</p>
      )}

      <div className="ws-photo-proof__upload no-print">
        <label className="ws-field">
          Caption (optional)
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Cut panels labelled / Paint booth finish"
            disabled={busy || disabled}
          />
        </label>
        <label className="ws-btn ws-btn--primary ws-photo-proof__pick">
          {busy ? 'Uploading…' : 'Post product photo'}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            disabled={busy || disabled || photos.length >= 8}
            onChange={(e) => void onPick(e.target.files?.[0] || null)}
          />
        </label>
      </div>
    </div>
  )
}
