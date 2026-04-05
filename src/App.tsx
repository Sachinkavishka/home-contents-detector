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

  // All completed scans — edits are kept here
  const [completedScans, setCompletedScans] = useState<ScanResult[]>([])
  const [viewingRoom, setViewingRoom] = useState(0)

  const handleImage = useCallback(
    async (base64: string, mimeType: string, previewUrl: string) => {
      setPreview(previewUrl)
      setPhase('scanning')

      try {
        const source = demoMode ? new DemoDataSource() : new ClaudeDataSource()
        const result = await source.analyseImage(base64, mimeType, previewUrl)
        setCompletedScans(prev => {
          const updated = [...prev, result]
          setViewingRoom(updated.length - 1)
          return updated
        })
        setPhase('results')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setPhase('error')
      }
    },
    [demoMode],
  )

  const addAnotherRoom = useCallback(() => {
    setPreview(null)
    setPhase('upload')
  }, [])

  const resetAll = useCallback(() => {
    setPreview(null)
    setPhase('upload')
    setCompletedScans([])
    setViewingRoom(0)
  }, [])

  // Propagate item edits back into completedScans
  const updateRoomItems = useCallback((roomIndex: number, items: DetectedItem[]) => {
    setCompletedScans(prev =>
      prev.map((scan, i) =>
        i === roomIndex
          ? { ...scan, items, totalValue: items.reduce((s, it) => s + it.estimatedValue * it.quantity, 0) }
          : scan,
      ),
    )
  }, [])

  const switchRoom = useCallback((i: number) => {
    setViewingRoom(i)
    setPhase('results')
  }, [])

  const totalAllRooms = completedScans.reduce((s, scan) =>
    s + scan.items.reduce((r, it) => r + it.estimatedValue * it.quantity, 0), 0
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

      {/* Rooms navigation bar — shown once at least one scan is done */}
      {completedScans.length > 0 && (
        <div className="rooms-bar">
          <div className="rooms-bar-inner">
            <div className="rooms-chips">
              {completedScans.map((scan, i) => (
                <button
                  key={i}
                  className={`room-chip ${viewingRoom === i && phase === 'results' ? 'active' : ''}`}
                  onClick={() => switchRoom(i)}
                >
                  {scan.roomType}
                </button>
              ))}
              {phase === 'upload' && (
                <span className="room-chip room-chip-scanning">📷 Scanning new room…</span>
              )}
            </div>

            <div className="rooms-bar-actions">
              {phase !== 'upload' && (
                <button className="btn-ghost small" onClick={addAnotherRoom}>
                  + Add Room
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
              <span>{completedScans.length} rooms</span>
              <span>·</span>
              <span>{completedScans.reduce((s, sc) => s + sc.items.length, 0)} items</span>
              <span>·</span>
              <strong>
                {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(totalAllRooms)} total
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
            onReset={completedScans.length === 1 ? resetAll : addAnotherRoom}
            resetLabel={completedScans.length === 1 ? 'Scan Another Photo' : '+ Add Another Room'}
            onItemsChange={(items) => updateRoomItems(viewingRoom, items)}
          />
        )}
      </main>
    </div>
  )
}
