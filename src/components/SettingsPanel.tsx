import { useState } from 'react'
import type { AppSettings, CustomField } from '../types'

interface Props {
  settings: AppSettings
  onUpdate: (patch: Partial<AppSettings>) => void
  onReset: () => void
  onClose: () => void
}

const FIELD_LABELS: Record<keyof AppSettings['formFields'], string> = {
  category:  'Category',
  condition: 'Condition',
  quantity:  'Quantity',
  notes:     'Notes',
  photos:    'Photos',
}

const FIELD_TYPE_LABELS: Record<CustomField['type'], string> = {
  text:           'Text',
  'multi-text':   'Multi-line Text',
  number:         'Number',
  'single-choice':'Single Choice',
  'multi-choice': 'Multiple Choice',
}

const CHOICE_TYPES = ['single-choice', 'multi-choice'] as const
function isChoiceType(t: CustomField['type']): t is 'single-choice' | 'multi-choice' {
  return CHOICE_TYPES.includes(t as 'single-choice' | 'multi-choice')
}

export function SettingsPanel({ settings, onUpdate, onReset, onClose }: Props) {
  const [newCategory, setNewCategory] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<CustomField['type']>('text')
  // Options for the "new field" being built
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([])
  const [newOptionInput, setNewOptionInput] = useState('')
  // Per-field add-option inputs for existing choice fields
  const [fieldOptionInputs, setFieldOptionInputs] = useState<Record<string, string>>({})

  // ── Form Fields ──────────────────────────────────────────────
  function toggleField(key: keyof AppSettings['formFields']) {
    onUpdate({ formFields: { ...settings.formFields, [key]: !settings.formFields[key] } })
  }

  // ── Custom Fields ────────────────────────────────────────────
  function addCustomField() {
    const label = newFieldLabel.trim()
    if (!label) return
    if (isChoiceType(newFieldType) && newFieldOptions.length === 0) return
    const field: CustomField = {
      id: `cf-${Date.now()}`,
      label,
      type: newFieldType,
      placeholder: newFieldType === 'number' ? '0' : '',
      options: isChoiceType(newFieldType) ? [...newFieldOptions] : undefined,
    }
    onUpdate({ customFields: [...settings.customFields, field] })
    setNewFieldLabel('')
    setNewFieldType('text')
    setNewFieldOptions([])
    setNewOptionInput('')
  }

  function removeCustomField(id: string) {
    onUpdate({ customFields: settings.customFields.filter(f => f.id !== id) })
  }

  function updateCustomField(id: string, patch: Partial<CustomField>) {
    onUpdate({
      customFields: settings.customFields.map(f =>
        f.id === id ? { ...f, ...patch } : f
      ),
    })
  }

  // ── New-field option helpers ─────────────────────────────────
  function addNewOption() {
    const opt = newOptionInput.trim()
    if (!opt || newFieldOptions.includes(opt)) return
    setNewFieldOptions(prev => [...prev, opt])
    setNewOptionInput('')
  }

  function removeNewOption(opt: string) {
    setNewFieldOptions(prev => prev.filter(o => o !== opt))
  }

  // ── Existing-field option helpers ────────────────────────────
  function addOptionToField(fieldId: string) {
    const input = (fieldOptionInputs[fieldId] ?? '').trim()
    if (!input) return
    const field = settings.customFields.find(f => f.id === fieldId)
    if (!field) return
    const existing = field.options ?? []
    if (existing.includes(input)) return
    updateCustomField(fieldId, { options: [...existing, input] })
    setFieldOptionInputs(prev => ({ ...prev, [fieldId]: '' }))
  }

  function removeOptionFromField(fieldId: string, option: string) {
    const field = settings.customFields.find(f => f.id === fieldId)
    if (!field) return
    updateCustomField(fieldId, { options: (field.options ?? []).filter(o => o !== option) })
  }

  // ── Categories ───────────────────────────────────────────────
  function addCategory() {
    const cat = newCategory.trim()
    if (!cat || settings.categories.includes(cat)) return
    onUpdate({ categories: [...settings.categories, cat] })
    setNewCategory('')
  }

  function removeCategory(cat: string) {
    onUpdate({ categories: settings.categories.filter(c => c !== cat) })
  }

  function moveCategory(index: number, dir: -1 | 1) {
    const cats = [...settings.categories]
    const swap = index + dir
    if (swap < 0 || swap >= cats.length) return
    ;[cats[index], cats[swap]] = [cats[swap], cats[index]]
    onUpdate({ categories: cats })
  }

  const canAddNewField = newFieldLabel.trim() !== '' &&
    (!isChoiceType(newFieldType) || newFieldOptions.length > 0)

  return (
    <div className="settings-backdrop" onMouseDown={onClose}>
      <div className="settings-panel" onMouseDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="settings-header">
          <div className="settings-title">
            <span className="settings-title-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </span>
            Settings
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">

          {/* ── Section: Form Fields ── */}
          <section className="settings-section">
            <div className="settings-section-label">Item Form Fields</div>
            <p className="settings-section-hint">Choose which fields appear when adding or editing an item.</p>
            <div className="settings-toggle-list">
              <div className="settings-toggle-row settings-toggle-locked">
                <span className="settings-toggle-name">Item Name</span>
                <span className="settings-required-badge">Required</span>
              </div>
              <div className="settings-toggle-row settings-toggle-locked">
                <span className="settings-toggle-name">Value (AUD)</span>
                <span className="settings-required-badge">Required</span>
              </div>
              {(Object.keys(FIELD_LABELS) as (keyof AppSettings['formFields'])[]).map(key => (
                <div key={key} className="settings-toggle-row">
                  <span className="settings-toggle-name">{FIELD_LABELS[key]}</span>
                  <button
                    className={`settings-toggle ${settings.formFields[key] ? 'on' : 'off'}`}
                    onClick={() => toggleField(key)}
                    aria-label={`Toggle ${FIELD_LABELS[key]}`}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section: Custom Fields ── */}
          <section className="settings-section">
            <div className="settings-section-label">Custom Fields</div>
            <p className="settings-section-hint">Add extra fields to the item form (e.g. Serial Number, Warranty, Purchase Store).</p>

            {/* Existing fields */}
            {settings.customFields.length > 0 && (
              <div className="settings-custom-field-list">
                {settings.customFields.map(field => (
                  <div key={field.id} className="settings-custom-field-block">
                    {/* Field row */}
                    <div className="settings-custom-field-row">
                      <input
                        className="form-input settings-custom-field-input"
                        value={field.label}
                        onChange={e => updateCustomField(field.id, { label: e.target.value })}
                        placeholder="Field label"
                      />
                      <select
                        className="form-input settings-custom-field-type"
                        value={field.type}
                        onChange={e => updateCustomField(field.id, { type: e.target.value as CustomField['type'] })}
                      >
                        {(Object.keys(FIELD_TYPE_LABELS) as CustomField['type'][]).map(t => (
                          <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                      <button
                        className="settings-icon-btn settings-icon-btn-delete"
                        onClick={() => removeCustomField(field.id)}
                        title="Remove field"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>

                    {/* Options manager for choice fields */}
                    {isChoiceType(field.type) && (
                      <div className="settings-options-area">
                        <div className="settings-options-label">
                          {field.type === 'single-choice' ? 'Single Choice' : 'Multiple Choice'} options:
                        </div>
                        <div className="settings-options-chips">
                          {(field.options ?? []).map(opt => (
                            <span key={opt} className="option-chip">
                              {opt}
                              <button
                                className="option-chip-remove"
                                onClick={() => removeOptionFromField(field.id, opt)}
                                title="Remove option"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </button>
                            </span>
                          ))}
                          {(field.options ?? []).length === 0 && (
                            <span className="settings-options-empty">No options yet — add one below</span>
                          )}
                        </div>
                        <div className="settings-options-add-row">
                          <input
                            className="form-input settings-options-input"
                            value={fieldOptionInputs[field.id] ?? ''}
                            onChange={e => setFieldOptionInputs(prev => ({ ...prev, [field.id]: e.target.value }))}
                            placeholder="New option..."
                            onKeyDown={e => e.key === 'Enter' && addOptionToField(field.id)}
                          />
                          <button
                            className="btn-ghost settings-add-btn"
                            onClick={() => addOptionToField(field.id)}
                            disabled={!(fieldOptionInputs[field.id] ?? '').trim()}
                          >+ Add</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add new field */}
            <div className="settings-new-field-block">
              <div className="settings-add-row">
                <input
                  className="form-input"
                  value={newFieldLabel}
                  onChange={e => setNewFieldLabel(e.target.value)}
                  placeholder="Field label (e.g. Serial Number)"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !isChoiceType(newFieldType)) addCustomField()
                  }}
                />
                <select
                  className="form-input settings-custom-field-type"
                  value={newFieldType}
                  onChange={e => {
                    setNewFieldType(e.target.value as CustomField['type'])
                    setNewFieldOptions([])
                    setNewOptionInput('')
                  }}
                >
                  {(Object.keys(FIELD_TYPE_LABELS) as CustomField['type'][]).map(t => (
                    <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                  ))}
                </select>
                <button
                  className="btn-ghost settings-add-btn"
                  onClick={addCustomField}
                  disabled={!canAddNewField}
                >+ Add</button>
              </div>

              {/* Options builder for new choice fields */}
              {isChoiceType(newFieldType) && (
                <div className="settings-options-area settings-options-area--new">
                  <div className="settings-options-label">
                    Add options for this {newFieldType === 'single-choice' ? 'Single Choice' : 'Multiple Choice'} field:
                  </div>
                  <div className="settings-options-chips">
                    {newFieldOptions.map(opt => (
                      <span key={opt} className="option-chip">
                        {opt}
                        <button
                          className="option-chip-remove"
                          onClick={() => removeNewOption(opt)}
                          title="Remove option"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </span>
                    ))}
                    {newFieldOptions.length === 0 && (
                      <span className="settings-options-empty">Add at least one option below</span>
                    )}
                  </div>
                  <div className="settings-options-add-row">
                    <input
                      className="form-input settings-options-input"
                      value={newOptionInput}
                      onChange={e => setNewOptionInput(e.target.value)}
                      placeholder="Option text..."
                      onKeyDown={e => e.key === 'Enter' && addNewOption()}
                    />
                    <button
                      className="btn-ghost settings-add-btn"
                      onClick={addNewOption}
                      disabled={!newOptionInput.trim()}
                    >+ Add</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Section: Categories ── */}
          <section className="settings-section">
            <div className="settings-section-label">Categories</div>
            <p className="settings-section-hint">Edit, reorder or remove the categories available in the form.</p>
            <div className="settings-category-list">
              {settings.categories.map((cat, i) => (
                <div key={cat} className="settings-category-row">
                  <div className="settings-category-order">
                    <button className="settings-order-btn" onClick={() => moveCategory(i, -1)} disabled={i === 0}>↑</button>
                    <button className="settings-order-btn" onClick={() => moveCategory(i, 1)} disabled={i === settings.categories.length - 1}>↓</button>
                  </div>
                  <span className="settings-category-name">{cat}</span>
                  <button
                    className="settings-icon-btn settings-icon-btn-delete"
                    onClick={() => removeCategory(cat)}
                    title="Remove category"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="settings-add-row">
              <input
                className="form-input"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="New category name"
                onKeyDown={e => e.key === 'Enter' && addCategory()}
              />
              <button
                className="btn-ghost settings-add-btn"
                onClick={addCategory}
                disabled={!newCategory.trim()}
              >+ Add</button>
            </div>
          </section>

          {/* ── Section: Defaults ── */}
          <section className="settings-section">
            <div className="settings-section-label">Default Values</div>
            <p className="settings-section-hint">Pre-fill these values when adding a new item manually.</p>
            <div className="settings-defaults-grid">
              <div className="form-field">
                <label className="form-label">Default Condition</label>
                <select
                  className="form-input"
                  value={settings.defaultCondition}
                  onChange={e => onUpdate({ defaultCondition: e.target.value as AppSettings['defaultCondition'] })}
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Default Quantity</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={settings.defaultQuantity}
                  onChange={e => onUpdate({ defaultQuantity: Math.max(1, Number(e.target.value)) })}
                />
              </div>
            </div>
          </section>

          {/* ── Reset ── */}
          <button
            className="settings-reset-btn"
            onClick={() => { if (window.confirm('Reset all settings to defaults?')) onReset() }}
          >
            Reset to Defaults
          </button>

        </div>
      </div>
    </div>
  )
}
