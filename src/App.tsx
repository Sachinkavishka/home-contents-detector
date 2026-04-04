import { useState, useCallback } from 'react'
import { ImageUpload } from './components/ImageUpload'
import { ItemsList } from './components/ItemsList'
import { ClaudeDataSource, DemoDataSource } from './datasources'
import type { ScanState } from './types'

export default function App() {
  const [demoMode, setDemoMode] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [scan, setScan] = useState<ScanState>({ status: 'idle', result: null, error: null })

  const handleImage = useCallback(
    async (base64: string, mimeType: string, previewUrl: string) => {
      setPreview(previewUrl)
      setScan({ status: 'scanning', result: null, error: null })

      try {
        const source = demoMode ? new DemoDataSource() : new ClaudeDataSource()
        const result = await source.analyseImage(base64, mimeType, previewUrl)
        setScan({ status: 'done', result, error: null })
      } catch (err) {
        setScan({
          status: 'error',
          result: null,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    },
    [demoMode],
  )

  const reset = useCallback(() => {
    setPreview(null)
    setScan({ status: 'idle', result: null, error: null })
  }, [])

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

      <main className="main-content">
        {scan.status === 'idle' && (
          <>
            <ImageUpload onImage={handleImage} disabled={false} />
            {!demoMode && (
              <div className="demo-prompt">
                <span>Want to explore first?</span>
                <button className="btn-ghost small" onClick={() => setDemoMode(true)}>
                  Try Demo Mode
                </button>
              </div>
            )}
          </>
        )}

        {scan.status === 'scanning' && (
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

        {scan.status === 'error' && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p className="error-message">{scan.error}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={reset}>
                Try Again
              </button>
              {!demoMode && (
                <button className="btn-ghost" onClick={() => { setDemoMode(true); reset() }}>
                  Try Demo Mode
                </button>
              )}
            </div>
          </div>
        )}

        {scan.status === 'done' && scan.result && (
          <ItemsList result={scan.result} onReset={reset} />
        )}
      </main>
    </div>
  )
}
