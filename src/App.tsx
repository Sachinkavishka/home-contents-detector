import { useState, useCallback } from 'react'
import { ImageUpload } from './components/ImageUpload'
import { ItemsList } from './components/ItemsList'
import { ClaudeDataSource, DemoDataSource } from './datasources'
import type { DetectedItem, ScanResult } from './types'
import { exportAllRoomsToExcel } from './utils/exportExcel'

type Phase = 'upload' | 'scanning' | 'results' | 'error'

export default function App() {
  const [demoMode, setDemoMode] = useState(false)
  const [phase, setPhase] = useState<Phase>('upload')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [completedScans, setCompletedScans] = useState<ScanResult[]>([])
  const [viewingRoom, setViewingRoom] = useState(0)
  const [mergeAfterScanIndex, setMergeAfterScanIndex] = useState<number | null>(null)

  // Rename chip inline edit state
  const [editingChipIndex, setEditingChipIndex] = useState<number | null>(null)
  const [chipEditValue, setChipEditValue] = useState('')

  const handleImage = useCallback(
    async (base64: string, mimeType: string, previewUrl: string) => {
      setPreview(previewUrl)
      setPhase('scanning')
      try {
        const source = demoMode ? new DemoDataSource() : new ClaudeDataSource()
        const result = await source.analyseImage(base64, mimeType, previewUrl)
        if (mergeAfterScanIndex !== null) {
          // Auto-merge new items into the existing room
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
    [demoMode, mergeAfterScanIndex],
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

  // ── Rename room ──────────────────────────────────────────────
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

  // ── Update items (from ItemsList edits / deletes) ────────────
  const updateRoomItems = useCallback((roomIndex: number, items: DetectedItem[]) => {
    setCompletedScans(prev =>
      prev.map((scan, i) =>
        i === roomIndex
          ? { ...scan, items, totalValue: items.reduce((s, it) => s + it.estimatedValue * it.quantity, 0) }
          : scan,
      ),
    )
  }, [])

  // ── Merge room fromIndex into toIndex ────────────────────────
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

  // ── Delete entire room ───────────────────────────────────────
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

  const grandTotal = completedScans.reduce(
    (s, sc) => s + sc.items.reduce((r, it) => r + it.estimatedValue * it.quantity, 0), 0
  )

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🏠</span>
            <span className="logo-text">Home Contents Detector</span>
          </div>
          <p className="tagline">
            Photograph any room — AI identifies everything and estimates replacement value
          </p>
        </div>
      </header>

      {demoMode && (
        <div className="demo-banner">
          <div className="api-key-inner">
            <span className="demo-badge">DEMO MODE</span>
            <span className="api-key-label">Using sample data</span>
            <button className="btn-ghost small" onClick={() => setDemoMode(false)}>
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
                  {/* Rename pencil — show on active chip */}
                  {viewingRoom === i && phase === 'results' && editingChipIndex !== i && (
                    <button
                      className="room-chip-rename"
                      title="Rename room"
                      onClick={() => startRenameChip(i)}
                    >✏</button>
                  )}
                </div>
              ))}
              {phase === 'upload' && (
                <span className="room-chip room-chip-scanning">📷 Scanning new area…</span>
              )}
            </div>

            <div className="rooms-bar-actions">
              {phase !== 'upload' && (
                <button className="btn-ghost small" onClick={addAnotherRoom}>
                  + Add Area
                </button>
              )}
              {completedScans.length > 1 && phase === 'results' && (
                <button
                  className="btn-primary small"
                  onClick={() => exportAllRoomsToExcel(completedScans)}
                >
                  📊 Export All ({completedScans.length} rooms)
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
                <span>Want to explore first?</span>
                <button className="btn-ghost small" onClick={() => setDemoMode(true)}>
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
                  : 'Claude is identifying items and looking up replacement values'}
            </p>
          </div>
        )}

        {phase === 'error' && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p className="error-message">{error}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={addAnotherRoom}>Try Again</button>
              {!demoMode && (
                <button className="btn-ghost" onClick={() => { setDemoMode(true); addAnotherRoom() }}>
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
            resetLabel="+ Scan Another Area"
            onItemsChange={(items) => updateRoomItems(viewingRoom, items)}
            allRooms={completedScans.length > 1
              ? completedScans.map((s, i) => ({ name: s.roomType, index: i }))
              : undefined}
            currentRoomIndex={viewingRoom}
            onMergeInto={(targetIndex) => mergeRooms(viewingRoom, targetIndex)}
            onDeleteRoom={completedScans.length > 1 ? () => deleteRoom(viewingRoom) : undefined}
            onScanAnotherAngle={() => scanAnotherAngle(viewingRoom)}
          />
        )}
      </main>
    </div>
  )
}
