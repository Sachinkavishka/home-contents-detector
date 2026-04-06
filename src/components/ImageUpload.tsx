import { useRef, useState, useCallback } from 'react'

interface Props {
  onImage: (base64: string, mimeType: string, preview: string) => void
  disabled: boolean
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.85

function compressImage(file: File): Promise<{ base64: string; mimeType: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      const base64 = dataUrl.split(',')[1]
      resolve({ base64, mimeType: 'image/jpeg', dataUrl })
    }
    img.onerror = reject
    img.src = objectUrl
  })
}

export function ImageUpload({ onImage, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [compressing, setCompressing] = useState(false)

  const processFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        alert('Please upload a JPEG, PNG, WebP or GIF image.')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        alert('Image must be under 20 MB.')
        return
      }
      setCompressing(true)
      try {
        const { base64, mimeType, dataUrl } = await compressImage(file)
        onImage(base64, mimeType, dataUrl)
      } catch {
        alert('Failed to process image. Please try another file.')
      } finally {
        setCompressing(false)
      }
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
      onClick={() => !disabled && !compressing && inputRef.current?.click()}
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

      <div className="upload-icon">
        {compressing ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        )}
      </div>

      <p className="upload-text">
        {compressing ? 'Preparing image…' : 'Drop a room photo here'}
      </p>
      <p className="upload-hint">
        or <strong>click to browse</strong> · JPEG, PNG, WebP · max 20 MB
      </p>
    </div>
  )
}
