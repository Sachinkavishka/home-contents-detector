import { useRef, useState, useCallback } from 'react'

interface Props {
  onImage: (base64: string, mimeType: string, preview: string) => void
  disabled: boolean
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function ImageUpload({ onImage, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const processFile = useCallback(
    (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        alert('Please upload a JPEG, PNG, WebP or GIF image.')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('Image must be under 20 MB.')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        // dataUrl = "data:<mimeType>;base64,<data>"
        const [header, base64] = dataUrl.split(',')
        const mimeType = header.split(':')[1].split(';')[0]
        onImage(base64, mimeType, dataUrl)
      }
      reader.readAsDataURL(file)
    },
    [onImage],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [disabled, processFile],
  )

  return (
    <div
      className={`upload-zone ${dragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processFile(file)
          e.target.value = ''
        }}
      />
      <div className="upload-icon">📷</div>
      <p className="upload-text">
        {disabled
          ? 'Enter your API key above to start'
          : 'Drop a photo here, or click to browse'}
      </p>
      <p className="upload-hint">JPEG, PNG, WebP or GIF · max 20 MB</p>
    </div>
  )
}
