import { useState, useCallback, useRef } from 'react'
import { ImageUpload } from './components/ImageUpload'
import { ItemsList } from './components/ItemsList'
import { SettingsPanel } from './components/SettingsPanel'
import { ClaudeDataSource, DemoDataSource } from './datasources'
import type { DetectedItem, ScanResult } from './types'
import { exportAllRoomsToExcel } from './utils/exportExcel'
import { useSettings } from './hooks/useSettings'

type Phase = 'upload' | 'scanning' | 'results' | 'error'

// ── SVG icons ──────────────────────────────────────────────
const IconHome = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const IconPencil = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)


export default function App() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const demoModeRef = useRef(false)
  const setDemoModeSync = (val: boolean) => {
    demoModeRef.current = val
    setDemoMode(val)
  }
  const [phase, setPhase] = useState<Phase>('upload')
  const [exportingAll, setExportingAll] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [completedScans, setCompletedScans] = useState<ScanResult[]>([])
  const [viewingRoom, setViewingRoom] = useState(0)
  const [mergeAfterScanIndex, setMergeAfterScanIndex] = useState<number | null>(null)

  const [editingChipIndex, setEditingChipIndex] = useState<number | null>(null)
  const [chipEditValue, setChipEditValue] = useState('')

  const handleImage = useCallback(
    async (base64: string, mimeType: string, previewUrl: string) => {
      setPreview(previewUrl)
      setPhase('scanning')
      try {
        const source = demoModeRef.current ? new DemoDataSource() : new ClaudeDataSource()
        const result = await source.analyseImage(base64, mimeType, previewUrl)
        if (mergeAfterScanIndex !== null) {
          const targetIndex = mergeAfterScanIndex
          setMergeAfterScanIndex(null)
          setCompletedScans(prev =>
            prev.map((scan, i) => {
              if (i !== targetIndex) return scan
              const mergedItems = [...scan.items, ...result.items]
              return { ...scan, items: mergedItems, totalValue: mergedItems.reduce((s, it) => s + it.estimatedValue * it.quantity, 0) }
            })
          )
          setViewingRoom(targetIndex)
        } else {
          setCompletedScans(prev => {
            const updated = [...prev, result]
            setViewingRoom(updated.length - 1)
            return updated
          })
        }
        setPhase('results')
      } catch (err) {
        setMergeAfterScanIndex(null)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setPhase('error')
      }
    },
    [mergeAfterScanIndex],
  )

  const addAnotherRoom = useCallback(() => {
    setMergeAfterScanIndex(null)
    setPreview(null)
    setPhase('upload')
  }, [])

  const scanAnotherAngle = useCallback((roomIndex: number) => {
    setMergeAfterScanIndex(roomIndex)
    setPreview(null)
    setPhase('upload')
  }, [])

  const resetAll = useCallback(() => {
    setPreview(null)
    setPhase('upload')
    setCompletedScans([])
    setViewingRoom(0)
  }, [])

  const switchRoom = useCallback((i: number) => {
    setViewingRoom(i)
    setPhase('results')
    setEditingChipIndex(null)
  }, [])

  const startRenameChip = (i: number) => {
    setChipEditValue(completedScans[i].roomType)
    setEditingChipIndex(i)
  }

  const commitRename = (i: number) => {
    const name = chipEditValue.trim()
    if (name) {
      setCompletedScans(prev => prev.map((s, idx) => idx === i ? { ...s, roomType: name } : s))
    }
    setEditingChipIndex(null)
  }

  const updateRoomItems = useCallback((roomIndex: number, items: DetectedItem[]) => {
    setCompletedScans(prev =>
      prev.map((scan, i) =>
        i === roomIndex
          ? { ...scan, items, totalValue: items.reduce((s, it) => s + it.estimatedValue * it.quantity, 0) }
          : scan,
      ),
    )
  }, [])

  const mergeRooms = useCallback((fromIndex: number, toIndex: number) => {
    setCompletedScans(prev => {
      const mergedItems = [...prev[toIndex].items, ...prev[fromIndex].items]
      const updated = prev
        .map((scan, i) =>
          i === toIndex
            ? { ...scan, items: mergedItems, totalValue: mergedItems.reduce((s, it) => s + it.estimatedValue * it.quantity, 0) }
            : scan,
        )
        .filter((_, i) => i !== fromIndex)
      setViewingRoom(toIndex > fromIndex ? toIndex - 1 : toIndex)
      return updated
    })
    setPhase('results')
  }, [])

  const deleteRoom = useCallback((roomIndex: number) => {
    setCompletedScans(prev => {
      const updated = prev.filter((_, i) => i !== roomIndex)
      if (updated.length === 0) {
        setPhase('upload')
        setViewingRoom(0)
      } else {
        setViewingRoom(Math.min(roomIndex, updated.length - 1))
      }
      return updated
    })
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleExportAll = useCallback(async () => {
    if (exportingAll) return
    setExportingAll(true)
    try {
      await exportAllRoomsToExcel(completedScans)
      showToast(`Exported ${completedScans.length} rooms to Excel`)
    } catch (e) {
      showToast(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setExportingAll(false)
    }
  }, [completedScans, exportingAll, showToast])

  const grandTotal = completedScans.reduce(
    (s, sc) => s + sc.items.reduce((r, it) => r + it.estimatedValue * it.quantity, 0), 0
  )

  return (
    <div className="app">
      {toast && <div className="toast">{toast}</div>}

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onReset={resetSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon"><IconHome /></span>
              <span className="logo-text">Contents<span>Scan</span></span>
            </div>
            <div className="header-divider" />
            <span className="tagline">AI-powered home contents valuation</span>
          </div>
          <div className="header-actions">
            <button className="btn-settings" onClick={() => setSettingsOpen(true)} title="Settings">
              <IconSettings />
            </button>
          </div>
        </div>
      </header>

      {/* ── Demo banner ── */}
      {demoMode && (
        <div className="demo-banner">
          <div className="api-key-inner">
            <span className="demo-badge">DEMO</span>
            <span className="api-key-label">Using sample data</span>
            <button className="btn-ghost small" onClick={() => setDemoModeSync(false)}>
              Switch to Real AI
            </button>
          </div>
        </div>
      )}

      {/* ── Rooms bar ── */}
      {completedScans.length > 0 && (
        <div className="rooms-bar">
          <div className="rooms-bar-inner">
            <div className="rooms-chips">
              {completedScans.map((scan, i) => (
                <div key={i} className="room-chip-wrapper">
                  {editingChipIndex === i ? (
                    <input
                      className="room-chip-input"
                      value={chipEditValue}
                      onChange={e => setChipEditValue(e.target.value)}
                      onBlur={() => commitRename(i)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename(i)
                        if (e.key === 'Escape') setEditingChipIndex(null)
                      }}
                      autoFocus
                    />
                  ) : (
                    <button
                      className={`room-chip ${viewingRoom === i && phase === 'results' ? 'active' : ''}`}
                      onClick={() => switchRoom(i)}
                    >
                      {scan.roomType}
                    </button>
                  )}
                  {viewingRoom === i && phase === 'results' && editingChipIndex !== i && (
                    <button className="room-chip-rename" title="Rename room" onClick={() => startRenameChip(i)}>
                      <IconPencil />
                    </button>
                  )}
                </div>
              ))}
              {phase === 'upload' && (
                <span className="room-chip room-chip-scanning">Scanning new area…</span>
              )}
            </div>

            <div className="rooms-bar-actions">
              {phase !== 'upload' && (
                <button className="btn-ghost small" onClick={addAnotherRoom}>
                  <IconPlus /> Add Area
                </button>
              )}
              {completedScans.length > 1 && phase === 'results' && (
                <button className="btn-primary small" onClick={handleExportAll} disabled={exportingAll}>
                  {exportingAll ? 'Exporting…' : <><IconDownload /> Export All ({completedScans.length} rooms)</>}
                </button>
              )}
              <button className="btn-ghost small" onClick={resetAll}>
                Start Over
              </button>
            </div>
          </div>

          {completedScans.length > 1 && (
            <div className="rooms-totals-bar">
              <span>{completedScans.length} areas</span>
              <span>·</span>
              <span>{completedScans.reduce((s, sc) => s + sc.items.length, 0)} items</span>
              <span>·</span>
              <strong>
                {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(grandTotal)} total
              </strong>
            </div>
          )}
        </div>
      )}

      <main className="main-content">
        {phase === 'upload' && (
          <>
            <ImageUpload onImage={handleImage} disabled={false} />
            {!demoMode && completedScans.length === 0 && (
              <div className="demo-prompt">
                <span>No camera handy?</span>
                <button className="btn-ghost small" onClick={() => setDemoModeSync(true)}>
                  Try Demo Mode
                </button>
              </div>
            )}
          </>
        )}

        {phase === 'scanning' && (
          <div className="scanning-state">
            {preview && (
              <div className="scanning-preview-wrap">
                <img src={preview} alt="Scanning…" className="scanning-preview" />
                <div className="scanning-overlay">
                  <div className="spinner" />
                  <span>{demoMode ? 'Loading demo data…' : 'Analysing contents…'}</span>
                </div>
              </div>
            )}
            <p className="scanning-hint">
              {demoMode
                ? 'Showing sample room contents'
                : mergeAfterScanIndex !== null
                  ? `Adding more items to ${completedScans[mergeAfterScanIndex]?.roomType ?? 'room'}…`
                  : 'AI is identifying items and estimating replacement values'}
            </p>
          </div>
        )}

        {phase === 'error' && (
          <div className="error-state">
            <div className="error-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2>Something went wrong</h2>
            <p className="error-message">{error}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={addAnotherRoom}>Try Again</button>
              {!demoMode && (
                <button className="btn-ghost" onClick={() => { setDemoModeSync(true); addAnotherRoom() }}>
                  Try Demo Mode
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'results' && completedScans[viewingRoom] && (
          <ItemsList
            key={viewingRoom}
            result={completedScans[viewingRoom]}
            onReset={addAnotherRoom}
            resetLabel="Scan Another Area"
            onItemsChange={(items) => updateRoomItems(viewingRoom, items)}
            allRooms={completedScans.length > 1
              ? completedScans.map((s, i) => ({ name: s.roomType, index: i }))
              : undefined}
            currentRoomIndex={viewingRoom}
            onMergeInto={(targetIndex) => mergeRooms(viewingRoom, targetIndex)}
            onDeleteRoom={completedScans.length > 1 ? () => deleteRoom(viewingRoom) : undefined}
            onScanAnotherAngle={() => scanAnotherAngle(viewingRoom)}
            settings={settings}
          />
        )}
      </main>
    </div>
  )
}
