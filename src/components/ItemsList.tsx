import { useState, useMemo } from 'react'
import type { DetectedItem, ScanResult, AppSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { exportToExcel } from '../utils/exportExcel'
import { ItemEditModal } from './ItemEditModal'

interface Props {
  result: ScanResult
  onReset: () => void
  resetLabel?: string
  onItemsChange?: (items: DetectedItem[]) => void
  allRooms?: { name: string; index: number }[]
  currentRoomIndex?: number
  onMergeInto?: (targetIndex: number) => void
  onDeleteRoom?: () => void
  onScanAnotherAngle?: () => void
  settings?: AppSettings
}

const CONDITION_BADGE: Record<string, string> = {
  excellent: 'badge-green',
  good:      'badge-blue',
  fair:      'badge-yellow',
  poor:      'badge-red',
}

// SVG icons for categories — clean, minimal
const CATEGORY_ICON: Record<string, JSX.Element> = {
  Electronics: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  Furniture: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/><line x1="6" y1="18" x2="6" y2="22"/><line x1="18" y1="18" x2="18" y2="22"/>
    </svg>
  ),
  Appliances: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 7h10v2H7z"/><circle cx="9" cy="15" r="2"/><path d="M14 14h2v4h-2z"/>
    </svg>
  ),
  'Art & Decor': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  Jewellery: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Clothing: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
    </svg>
  ),
  Books: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  'Sports & Fitness': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/>
    </svg>
  ),
  Tools: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Toys: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
}

const DefaultCategoryIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
)

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const IconDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const IconCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconMerge = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)

function fmt(value: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value)
}

export function ItemsList({ result, onReset, resetLabel = 'Scan Another Photo', onItemsChange, allRooms, currentRoomIndex, onMergeInto, onDeleteRoom, onScanAnotherAngle, settings = DEFAULT_SETTINGS }: Props) {
  const [items, setItems] = useState<DetectedItem[]>(() => result.items)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(result.items.map((i) => i.id)),
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingItem, setAddingItem] = useState(false)
  const otherRooms = allRooms?.filter(r => r.index !== currentRoomIndex) ?? []
  const [mergeTarget, setMergeTarget] = useState<number>(() => otherRooms[0]?.index ?? 0)

  const allIds = useMemo(() => items.map((i) => i.id), [items])
  const allSelected = selected.size === allIds.length
  const noneSelected = selected.size === 0

  const editingItem = editingId ? items.find((i) => i.id === editingId) ?? null : null

  function saveEdit(updated: DetectedItem) {
    setItems(prev => {
      const next = prev.map(i => i.id === updated.id ? updated : i)
      onItemsChange?.(next)
      return next
    })
    setEditingId(null)
  }

  function saveNewItem(newItem: DetectedItem) {
    setItems(prev => {
      const next = [...prev, newItem]
      onItemsChange?.(next)
      return next
    })
    setSelected(prev => new Set([...prev, newItem.id]))
    setAddingItem(false)
  }

  const blankItem = (): DetectedItem => ({
    id: `manual-${Date.now()}`,
    name: '',
    category: settings.categories[0] ?? 'Other',
    condition: settings.defaultCondition,
    estimatedValue: 0,
    quantity: settings.defaultQuantity,
    notes: '',
    photos: [],
    customData: {},
  })

  function deleteItem(id: string) {
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next })
    setItems(prev => {
      const next = prev.filter(i => i.id !== id)
      onItemsChange?.(next)
      return next
    })
  }

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }

  function toggleCategory(ids: string[]) {
    const allCatSelected = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allCatSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  const totalValue = useMemo(
    () => items.reduce((s, i) => s + i.estimatedValue * i.quantity, 0),
    [items],
  )

  const selectedValue = items
    .filter((i) => selected.has(i.id))
    .reduce((s, i) => s + i.estimatedValue * i.quantity, 0)

  const byCategory = items.reduce<Record<string, typeof items>>(
    (acc, item) => {
      ;(acc[item.category] ??= []).push(item)
      return acc
    },
    {},
  )

  return (
    <>
      {editingItem && (
        <ItemEditModal
          item={editingItem}
          onSave={saveEdit}
          onClose={() => setEditingId(null)}
          settings={settings}
        />
      )}

      {addingItem && (
        <ItemEditModal
          item={blankItem()}
          onSave={saveNewItem}
          onClose={() => setAddingItem(false)}
          settings={settings}
          isNew
        />
      )}

      <div className="results-layout">
        {/* ── Sidebar ── */}
        <aside className="results-sidebar">
          {result.imageUrl ? (
            <img src={result.imageUrl} alt="Scanned room" className="result-image" />
          ) : (
            <div className="result-image-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                <path d="M9 21V12h6v9"/>
              </svg>
              <span>Manual Entry</span>
            </div>
          )}

          <div className="summary-card">
            <div className="summary-room">{result.roomType}</div>
            <div className="summary-total">{fmt(totalValue)}</div>
            <div className="summary-label">total replacement value</div>
            <div className="summary-meta">
              {items.length} items · {Object.keys(byCategory).length} categories
            </div>
            <div className="summary-date">
              Scanned {new Date(result.scanDate).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>

          {/* Export panel */}
          <div className="export-panel">
            <div className="export-header">
              <span className="export-title">Export to Excel</span>
              <span className="export-count">{selected.size} of {allIds.length} items</span>
            </div>

            <div className="export-selected-value">
              Selected: <strong>{fmt(selectedValue)}</strong>
            </div>

            <label className="checkbox-row select-all-row">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = !allSelected && !noneSelected }}
                onChange={toggleAll}
              />
              <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
            </label>

            <button
              className="btn-export"
              disabled={noneSelected}
              onClick={() => exportToExcel({ ...result, items, totalValue }, selected)}
            >
              <IconDownload /> Download .xlsx
            </button>
          </div>

          {onScanAnotherAngle && (
            <button className="btn-scan-angle" onClick={onScanAnotherAngle}>
              <IconCamera /> Scan Another Angle
            </button>
          )}

          <button className="btn-primary full-width" onClick={onReset}>
            {resetLabel}
          </button>

          {/* Merge */}
          {otherRooms.length > 0 && onMergeInto && (
            <div className="merge-panel">
              <div className="merge-title">Merge all items into</div>
              <div className="merge-row">
                <select
                  className="form-input merge-select"
                  value={mergeTarget}
                  onChange={e => setMergeTarget(Number(e.target.value))}
                >
                  {otherRooms.map(r => (
                    <option key={r.index} value={r.index}>{r.name}</option>
                  ))}
                </select>
                <button className="btn-ghost merge-btn" onClick={() => onMergeInto(mergeTarget)}>
                  <IconMerge /> Merge
                </button>
              </div>
            </div>
          )}

          {/* Delete room */}
          {onDeleteRoom && (
            <button
              className="btn-delete-room"
              onClick={() => { if (window.confirm('Delete this room and all its items?')) onDeleteRoom() }}
            >
              <IconTrash /> Delete This Room
            </button>
          )}
        </aside>

        {/* ── Items ── */}
        <main className="results-main">
          <div className="add-item-bar">
            <button className="btn-add-item" onClick={() => setAddingItem(true)}>
              <IconPlus /> Add Item Manually
            </button>
          </div>

          {Object.entries(byCategory)
            .sort(([, a], [, b]) =>
              b.reduce((s, i) => s + i.estimatedValue * i.quantity, 0) -
              a.reduce((s, i) => s + i.estimatedValue * i.quantity, 0),
            )
            .map(([category, catItems]) => {
              const catIds = catItems.map((i) => i.id)
              const allCatSelected = catIds.every((id) => selected.has(id))
              const someCatSelected = catIds.some((id) => selected.has(id))

              return (
                <section key={category} className="category-section">
                  <h3 className="category-heading">
                    <label className="checkbox-row" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={allCatSelected}
                        ref={(el) => { if (el) el.indeterminate = !allCatSelected && someCatSelected }}
                        onChange={() => toggleCategory(catIds)}
                      />
                    </label>
                    <span className="category-icon">
                      {CATEGORY_ICON[category] ?? <DefaultCategoryIcon />}
                    </span>
                    {category}
                    <span className="category-subtotal">
                      {fmt(catItems.reduce((s, i) => s + i.estimatedValue * i.quantity, 0))}
                    </span>
                  </h3>

                  <div className="items-table">
                    <div className="items-header">
                      <span></span>
                      <span>Item</span>
                      <span>Condition</span>
                      <span>Qty</span>
                      <span className="align-right">Value</span>
                      <span></span>
                    </div>

                    {catItems
                      .sort((a, b) => b.estimatedValue - a.estimatedValue)
                      .map((item) => (
                        <label key={item.id} className={`item-row ${selected.has(item.id) ? 'item-selected' : 'item-deselected'}`}>
                          <span className="item-check">
                            <input
                              type="checkbox"
                              checked={selected.has(item.id)}
                              onChange={() => toggleItem(item.id)}
                            />
                          </span>
                          <div className="item-name-col">
                            <span className="item-name">{item.name}</span>
                            <div className="item-mobile-row">
                              <span className="item-mobile-value">{fmt(item.estimatedValue * item.quantity)}</span>
                              <button className="item-mobile-edit" type="button"
                                onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingId(item.id) }}>
                                <IconEdit />
                              </button>
                              <button className="item-mobile-delete" type="button"
                                onClick={e => { e.preventDefault(); e.stopPropagation(); deleteItem(item.id) }}>
                                <IconTrash />
                              </button>
                            </div>
                            {item.notes && <span className="item-notes">{item.notes}</span>}
                            {!!item.photos?.length && (
                              <div className="item-photo-strip">
                                {item.photos.slice(0, 4).map((src, i) => (
                                  <img key={i} src={src} alt="" className="item-photo-thumb" />
                                ))}
                                {item.photos.length > 4 && (
                                  <span className="item-photo-more">+{item.photos.length - 4}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <span>
                            <span className={`badge ${CONDITION_BADGE[item.condition]}`}>
                              {item.condition}
                            </span>
                          </span>
                          <span className="item-qty">{item.quantity}</span>
                          <span className="item-value align-right">
                            {fmt(item.estimatedValue * item.quantity)}
                            {item.quantity > 1 && (
                              <span className="item-unit-price">{fmt(item.estimatedValue)} each</span>
                            )}
                          </span>
                          <span className="item-edit-col">
                            <button className="btn-edit-item" type="button" title="Edit item"
                              onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingId(item.id) }}>
                              <IconEdit />
                            </button>
                            <button className="btn-delete-item" type="button" title="Delete item"
                              onClick={e => { e.preventDefault(); e.stopPropagation(); deleteItem(item.id) }}>
                              <IconTrash />
                            </button>
                          </span>
                        </label>
                      ))}
                  </div>
                </section>
              )
            })}
        </main>
      </div>
    </>
  )
}
