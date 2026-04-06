export interface DetectedItem {
  id: string
  name: string
  category: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  estimatedValue: number
  quantity: number
  notes?: string
  photos?: string[]
  customData?: Record<string, string | number | string[]>
}

export interface CustomField {
  id: string
  label: string
  type: 'text' | 'multi-text' | 'number' | 'single-choice' | 'multi-choice'
  placeholder?: string
  options?: string[]
}

export interface AppSettings {
  formFields: {
    category: boolean
    condition: boolean
    quantity: boolean
    notes: boolean
    photos: boolean
  }
  customFields: CustomField[]
  categories: string[]
  defaultCondition: 'excellent' | 'good' | 'fair' | 'poor'
  defaultQuantity: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  formFields: {
    category: true,
    condition: true,
    quantity: true,
    notes: true,
    photos: true,
  },
  customFields: [],
  categories: [
    'Electronics', 'Furniture', 'Appliances', 'Art & Decor',
    'Jewellery', 'Clothing', 'Books', 'Sports & Fitness', 'Tools', 'Toys', 'Other',
  ],
  defaultCondition: 'good',
  defaultQuantity: 1,
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
