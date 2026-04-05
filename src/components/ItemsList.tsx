import { useState, useMemo } from 'react'
import type { DetectedItem, ScanResult } from '../types'
import { exportToExcel } from '../utils/exportExcel'
import { ItemEditModal } from './ItemEditModal'

interface Props {
  result: ScanResult
  onReset: () => void
  resetLabel?: string
  onItemsChange?: (items: DetectedItem[]) => void
}

const CONDITION_BADGE: Record<string, string> = {
  excellent: 'badge-green',
  good: 'badge-blue',
  fair: 'badge-yellow',
  poor: 'badge-red',
}

const CATEGORY_EMOJI: Record<string, string> = {
  Electronics: '📺',
  Furniture: '🪑',
  Appliances: '🍳',
  'Art & Decor': '🖼️',
  Jewellery: '💎',
  Clothing: '👗',
  Books: '📚',
  'Sports & Fitness': '🏋️',
  Tools: '🔧',
  Toys: '🧸',
}

function fmt(value: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value)
}

export function ItemsList({ result, onReset, resetLabel = 'Scan Another Photo', onItemsChange }: Props) {
  const [items, setItems] = useState<DetectedItem[]>(() => result.items)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(result.items.map((i) => i.id)),
  )
  const [editingId, setEditingId] = useState<string | null>(null)

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
        />
      )}

      <div className="results-layout">
        {/* ── Sidebar ── */}
        <aside className="results-sidebar">
          <img src={result.imageUrl} alt="Scanned room" className="result-image" />

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

          {/* Excel export panel */}
          <div className="export-panel">
            <div className="export-header">
              <span className="export-title">📊 Export to Excel</span>
              <span className="export-count">
                {selected.size} of {allIds.length} items
              </span>
            </div>

            <div className="export-selected-value">
              Selected value: <strong>{fmt(selectedValue)}</strong>
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
              ⬇ Download .xlsx
            </button>
          </div>

          <button className="btn-primary full-width" onClick={onReset}>
            {resetLabel}
          </button>
        </aside>

        {/* ── Items ── */}
        <main className="results-main">
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
                    <span>{CATEGORY_EMOJI[category] ?? '📦'}</span>
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
                            <div className="item-mobile-row">
                              <span className="item-name">{item.name}</span>
                              <span className="item-mobile-value">
                                {fmt(item.estimatedValue * item.quantity)}
                              </span>
                              <button
                                className="item-mobile-edit"
                                type="button"
                                onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingId(item.id) }}
                              >✏</button>
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
                              <span className="item-unit-price"> ({fmt(item.estimatedValue)} ea)</span>
                            )}
                          </span>
                          <span className="item-edit-col">
                            <button
                              className="btn-edit-item"
                              type="button"
                              title="Edit item"
                              onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingId(item.id) }}
                            >
                              ✏
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
