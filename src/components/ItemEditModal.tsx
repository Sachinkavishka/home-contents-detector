import { useState, useRef } from 'react'
import type { DetectedItem, AppSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface Props {
  item: DetectedItem
  onSave: (updated: DetectedItem) => void
  onClose: () => void
  isNew?: boolean
  settings?: AppSettings
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ItemEditModal({ item, onSave, onClose, isNew = false, settings = DEFAULT_SETTINGS }: Props) {
  const { formFields, customFields, categories } = settings
  const [draft, setDraft] = useState<DetectedItem>({
    ...item,
    photos: item.photos ? [...item.photos] : [],
    customData: item.customData ? { ...item.customData } : {},
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
          <h2 className="modal-title">{isNew ? 'Add Item Manually' : 'Edit Item'}</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Name — always shown */}
          <div className="form-field">
            <label className="form-label">Item Name</label>
            <input
              className="form-input"
              value={draft.name}
              placeholder="e.g. Samsung 65″ TV"
              onChange={e => patch('name', e.target.value)}
              autoFocus
            />
          </div>

          {/* Value — always shown */}
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

          {/* Category + Condition — conditional */}
          {(formFields.category || formFields.condition) && (
            <div className="form-row">
              {formFields.category && (
                <div className="form-field">
                  <label className="form-label">Category</label>
                  <input
                    className="form-input"
                    list="category-options"
                    value={draft.category}
                    onChange={e => patch('category', e.target.value)}
                  />
                  <datalist id="category-options">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              )}
              {formFields.condition && (
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
              )}
            </div>
          )}

          {/* Quantity — conditional */}
          {formFields.quantity && (
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
          )}

          {/* Notes — conditional */}
          {formFields.notes && (
            <div className="form-field">
              <label className="form-label">Notes</label>
              <textarea
                className="form-input form-textarea"
                value={draft.notes ?? ''}
                onChange={e => patch('notes', e.target.value || undefined)}
                rows={2}
                placeholder="e.g. Purchased 2022, model XYZ"
              />
            </div>
          )}

          {/* Custom fields */}
          {customFields.map(field => (
            <div key={field.id} className="form-field">
              <label className="form-label">{field.label}</label>
              <input
                className="form-input"
                type={field.type}
                min={field.type === 'number' ? 0 : undefined}
                placeholder={field.placeholder}
                value={draft.customData?.[field.id] ?? ''}
                onChange={e => setDraft(prev => ({
                  ...prev,
                  customData: { ...prev.customData, [field.id]: field.type === 'number' ? Number(e.target.value) : e.target.value }
                }))}
              />
            </div>
          ))}

          {/* Photos — conditional */}
          {formFields.photos && (
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
                <button type="button" className="btn-ghost" onClick={() => libraryRef.current?.click()}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Add from Library
                </button>
                <button type="button" className="btn-ghost" onClick={() => cameraRef.current?.click()}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                  </svg>
                  Take Photo
                </button>
              </div>

              <input ref={libraryRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }}
                onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={!draft.name.trim()}
            onClick={() => onSave(draft)}
          >
            {isNew ? 'Add Item' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  )
}
