import { useState } from 'react'

interface Props {
  onSave: (key: string) => void
  saved: boolean
}

export function ApiKeyInput({ onSave, saved }: Props) {
  const [key, setKey] = useState('')
  const [visible, setVisible] = useState(false)

  return (
    <div className="api-key-banner">
      <div className="api-key-inner">
        <span className="api-key-label">
          {saved ? '✓ API key set' : '🔑 Enter your Anthropic API key to get started'}
        </span>
        {!saved && (
          <div className="api-key-form">
            <input
              type={visible ? 'text' : 'password'}
              placeholder="sk-ant-..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="api-key-input"
              onKeyDown={(e) => e.key === 'Enter' && key.startsWith('sk-') && onSave(key)}
            />
            <button
              className="btn-ghost"
              onClick={() => setVisible((v) => !v)}
              title={visible ? 'Hide' : 'Show'}
            >
              {visible ? '🙈' : '👁️'}
            </button>
            <button
              className="btn-primary"
              disabled={!key.startsWith('sk-')}
              onClick={() => onSave(key)}
            >
              Save
            </button>
          </div>
        )}
        {saved && (
          <button className="btn-ghost small" onClick={() => onSave('')}>
            Change
          </button>
        )}
      </div>
    </div>
  )
}
