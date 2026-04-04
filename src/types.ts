export interface DetectedItem {
  id: string
  name: string
  category: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  estimatedValue: number
  quantity: number
  notes?: string
  photos?: string[]
}

export interface ScanResult {
  items: DetectedItem[]
  roomType: string
  scanDate: string
  imageUrl: string
  totalValue: number
}

export interface ScanState {
  status: 'idle' | 'scanning' | 'done' | 'error'
  result: ScanResult | null
  error: string | null
}
