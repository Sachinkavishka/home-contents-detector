import { useState, useRef } from 'react'
import type { DetectedItem } from '../types'

interface Props {
  item: DetectedItem
  onSave: (updated: DetectedItem) => void
  onClose: () => void
}

const CATEGORIES = [
  'Electronics', 'Furniture', 'Appliances', 'Art & Decor',
  'Jewellery', 'Clothing', 'Books', 'Sports & Fitness', 'Tools', 'Toys', 'Other',
]

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ItemEditModal({ item, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<DetectedItem>({
    ...item,
    photos: item.photos ? [...item.photos] : [],
  })
  const libraryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  function patch<K extends keyof DetectedItem>(key: K, value: DetectedItem[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const dataUrls = await Promise.all(Array.from(files).map(fileToDataUrl))
    setDraft(prev => ({ ...prev, photos: [...(prev.photos ?? []), ...dataUrls] }))
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-title">Edit Item</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Name */}
          <div className="form-field">
            <label className="form-label">Item Name</label>
            <input
              className="form-input"
              value={draft.name}
              onChange={e => patch('name', e.target.value)}
            />
          </div>

          {/* Category + Condition */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Category</label>
              <input
                className="form-input"
                list="category-options"
                value={draft.category}
                onChange={e => patch('category', e.target.value)}
              />
              <datalist id="category-options">
                {CATEGORIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="form-field">
              <label className="form-label">Condition</label>
              <select
                className="form-input"
                value={draft.condition}
                onChange={e => patch('condition', e.target.value as DetectedItem['condition'])}
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          {/* Value + Quantity */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Value (AUD)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="1"
                value={draft.estimatedValue}
                onChange={e => patch('estimatedValue', Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Quantity</label>
              <input
                className="form-input"
                type="number"
                min="1"
                step="1"
                value={draft.quantity}
                onChange={e => patch('quantity', Math.max(1, Math.round(Number(e.target.value))))}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-field">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input form-textarea"
              value={draft.notes ?? ''}
              onChange={e => patch('notes', e.target.value || undefined)}
              rows={2}
            />
          </div>

          {/* Photos */}
          <div className="form-field">
            <label className="form-label">
              Photos {draft.photos?.length ? `(${draft.photos.length})` : ''}
            </label>

            {(draft.photos?.length ?? 0) > 0 && (
              <div className="photo-grid">
                {draft.photos!.map((src, i) => (
                  <div key={i} className="photo-thumb">
                    <img src={src} alt={`Photo ${i + 1}`} />
                    <button
                      className="photo-remove"
                      type="button"
                      onClick={() =>
                        setDraft(prev => ({
                          ...prev,
                          photos: prev.photos?.filter((_, idx) => idx !== i),
                        }))
                      }
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="photo-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => libraryRef.current?.click()}
              >
                📁 Add from Library
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => cameraRef.current?.click()}
              >
                📷 Take Photo
              </button>
            </div>

            {/* hidden inputs */}
            <input
              ref={libraryRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              style={{ display: 'none' }}
              onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(draft)}>Save Changes</button>
        </div>

      </div>
    </div>
  )
}
